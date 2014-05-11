/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2013 - Jan Smolders

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

exports.engine = 'jade';

/* Modules */
var fs = require('fs')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
, functions = require('./plugins-functions');
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

exports.index = function(req, res, next){	
	res.render('plugins',{
		selectedTheme: config.theme
	});
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;
	
	if (optionalParam === undefined){
		switch(infoRequest) {
			case('loadItems'):
				functions.getAvailablePlugins(req,res);
			break;
			case('reloadServer'):
				console.log('asd')
				functions.reloadServer(req,res);
			break;
			default:
				return;
			break;		
		}	
	}

	
	if(!action){
		switch(optionalParam) {
			case('uninstall'):
				functions.pluginManager(req, res, infoRequest, 'remove');
			break;	
			case('install'):
				functions.pluginManager(req,res, infoRequest, 'install');
			break;
			case('upgrade'):
				functions.pluginManager(req,res, infoRequest, 'install');  //for some reason update isnt working
			break;		
		}
	}	
};