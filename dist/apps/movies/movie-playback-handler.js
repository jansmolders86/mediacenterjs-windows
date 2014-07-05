/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* Global imports */
var colors = require('colors')
	, os = require('os')
	, fs = require('fs.extra')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

	var dblite = require('dblite');
	if(os.platform() === 'win32'){
		dblite.bin = "./bin/sqlite3/sqlite3";
	}
	var db = dblite('./lib/database/mcjs.sqlite');
	db.on('info', function (text) { console.log(text) });
	db.on('error', function (err) { console.error('Database error: ' + err) });

/* Public Methods */

/**
 * Starts video streaming for the specified Movie-File.
 * @param response          The response to write the video stream to
 * @param movieUrl          The URL to the Movie
 * @param movieFile         The Movie-File
 */
exports.startPlayback = function(response,platform, movieUrl, movieFile, subtitleUrl, subtitleTitle) {
    console.log('Getting ready to transcode '+movieFile+' for '+platform);
    var fileName =  movieFile.replace(/\.[^.]*$/,'')
        , outputName =  fileName.replace(/ /g,"-")
        , ExecConfig = {  maxBuffer: 9000*1024 }
        , outputPath = "./public/data/movies/"+outputName+".mp4"
        , hasSub = false;

    GetMovieDurarion(response, movieUrl, movieFile, function(data){
        var movieDuration = data;

        if(fs.existsSync(subtitleUrl)){
            var subOutput = "./public/data/movies/"+subtitleTitle;
            fs.writeFileSync(subOutput, fs.readFileSync(subtitleUrl));
            hasSub = true;
        }

        checkProgression(movieFile, function(data){
            if(data.progression !== 0 && data !== undefined){
                var movieProgression = data.progression;

                if(!fs.existsSync(outputPath) || data.transcodingstatus === 'pending'){
                    // Start transcode if file was deleted.
                    startTranscoding(response,movieUrl,platform, movieFile, outputPath, ExecConfig);
                };

            } else {
                var movieProgression = 0;

                if( data.transcodingstatus === 'pending'){
                    fs.exists(outputPath, function(e,exists){
                        if(!e){
                            
                            if(exists){
                                fs.unlinkSync(outputPath);
                            }
                            

                            if(fs.existsSync(movieUrl)){
                                startTranscoding(response,movieUrl,platform, movieFile, outputPath, ExecConfig);
                            } else{
                                console.log('Movie file '+ movieUrl + 'not found, did you move or delete it?');
                            }
                        }
                    });
               
					
                }
            }

            var movieInfo = {
                'duration': movieDuration,
                'progression': movieProgression,
                'subtitle': hasSub
            }

            response.json(movieInfo);

        });
	});
};

/* Private Methods */

GetMovieDurarion = function(response, movieUrl, movieFile, callback) {
	var probe = require('node-ffprobe');
	probe(movieUrl, function(err, probeData) {
        if(!err){
            if(probeData !== undefined || probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== undefined && probeData.streams[0].duration !== "N/A" ){
                console.log('Metadata found, continuing...');
                var data = probeData.streams[0].duration;
                callback(data);
            } else {
                console.log('Falling back to IMDB runtime information' .blue);
                getDurationFromDatabase(movieFile, function(data){
                    if(data !== null){
                        callback(data);
                    } else{
                        console.log('Unknown movie duration, falling back to estimated duration.' .red);
                        var data = 9000;
                        callback(data);
                    }
                });

            }
        }else {
            console.log('Using fallback length due to error: ',err);
            var data = 9000;
            callback(data);
        }
	});

};

getDurationFromDatabase = function(movieFile, callback) {
	var original_title =  movieFile.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")

	db.query('SELECT * FROM movies WHERE original_name =? ', [ original_title ], {
			local_name 		: String,
			original_name   : String,
			poster_path  	: String,
			backdrop_path   : String,
			imdb_id  		: String,
			rating  		: String,
			certification   : String,
			genre  			: String,
			runtime  		: String,
			overview  		: String,
			cd_number  		: String
		},
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0){
				var runtime = parseInt(rows[0].runtime) * 60;
				console.log('Runtime found', rows[0].runtime);
				var data = runtime;
                callback(data);
			} else {
				callback(null);
			}
		}
	);
}

checkProgression = function(movieFile, callback) {
    db.query('SELECT * FROM progressionmarker WHERE movietitle =? ', [ movieFile ], {
            movietitle 		: String,
            progression     : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                var data = {
                       'progression':rows[0].progression,
                       'transcodingstatus':rows[0].transcodingstatus
                };
                callback(data);
            } else {
                var data = {
                    'progression':0,
                    'transcodingstatus':'pending'
                }
                callback(data);
            }
        }
    );
}


startTranscoding = function(response, movieUrl, platform,movieFile, outputPath, ExecConfig){
    var ffmpeg = require('fluent-ffmpeg');
    
    if(os.platform() === 'win32'){
        var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
        ExecConfig = {  maxBuffer: 9000*1024, env: process.env.ffmpegPath };
    }
    
    var FFMPEG_TIMEOUT = 15000;
    var MOBILE_FFMPEG_OPTS = [
        '-threads 0', 
        '-loglevel quiet',
        '-ac 2', 
        '-b:a 160000'];
    
    
    if(!fs.existsSync(outputPath)){ 
        if(platform === 'desktop'){
            browserTranscoding(response, movieUrl, platform,movieFile, outputPath, ExecConfig);  
        } else if(platform === 'android'){
            androidTranscoding(response, movieUrl, platform,movieFile, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        } else if(platform === 'ios'){
            iosTranscoding(response, movieUrl, platform,movieFile, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        }
    }
}

browserTranscoding = function(response, movieUrl, platform,movieFile, outputPath, ExecConfig){
    console.log('Starting transcoding for', platform);
    var ffmpeg = 'ffmpeg -i "'+movieUrl+'" -g 52 -threads 0 -vcodec libx264 -coder 0 -flags -loop -pix_fmt yuv420p -crf 22 -subq 0 -sc_threshold 0 -s 1280x720 -profile:v baseline -keyint_min 150 -deinterlace -maxrate 10000000 -bufsize 10000000 -b 1200k -acodec aac -ar 48000 -ab 192k -strict experimental -frag_duration 1000 -movflags +frag_keyframe+empty_moov "'+outputPath+'"';
    var exec = require('child_process').exec
    , child = exec(ffmpeg, ExecConfig, function(err, stdout, stderr) {
        if (err) {
            console.log('FFMPEG error: ',err) ;
        } else{
            console.log('Transcoding complete');

            db.query('UPDATE progressionmarker SET transcodingstatus = "done" WHERE movietitle =? ', [ movieFile ]);
        }
    });  
    child.stdout.on('data', function(data) { console.log(data.toString()); });
    child.stderr.on('data', function(data) { console.log(data.toString()); });
    child.on('exit', function() {  console.error('Child process exited'); });
}


iosTranscoding = function(response, movieUrl, platform,movieFile, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT){
    console.log('Starting transcoding for', platform);
    var IOS_FFMPEG_OPTS = [
        '-vcodec libx264',
        '-pix_fmt yuv420p',
        '-s qvga',
        '-segment_list_type m3u8',
        '-map 0:v',
        '-map 0:a:0',
        '-c:a mp3',
        '-f hls',
        '-hls_time 10',
        '-hls_list_size 6',
        '-hls_wrap 18',
        '-start_number 1',
        '-deinterlace'].concat(MOBILE_FFMPEG_OPTS);

    response.writeHead(200, { 
        'Content-Type':'application/x-mpegURL', 
        'Content-Length':movieFile.size	
    });


    var proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })
    if(os.platform() === 'win32'){
        proc.setFfmpegPath(ffmpegPath)
    }
    proc.addOptions(MOBILE_FFMPEG_OPTS)
    proc.writeToStream(response, function(return_code, error){
    });
}

androidTranscoding = function(response, movieUrl, platform,movieFile, outputPath, ExecConfig){
    console.log('Starting transcoding for', platform);
    response.writeHead(200, { 
        'Content-Type':'video/webm', 
        'Content-Length':movieFile.size
    });

    var ANDROID_FFMPEG_OPTS = [
        '-vcodec libx264', 
        '-vb 250k',
        '-s 1280x720',
        '-profile:v baseline',
        '-keyint_min 150', 
        '-pix_fmt yuv420p',
        '-deinterlace',
        '-c:a mp3', 
        '-f mp4',
        '-movflags',
        'frag_keyframe+empty_moov']
    .concat(MOBILE_FFMPEG_OPTS);

    var proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })
    if(os.platform() === 'win32'){
        proc.setFfmpegPath(ffmpegPath)
    }
    proc.addOptions(MOBILE_FFMPEG_OPTS)
    proc.writeToStream(response, function(return_code, error){
    });

}