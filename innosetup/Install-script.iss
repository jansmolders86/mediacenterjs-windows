; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "MediacenterJS"
#define MyAppVersion "Beta"
#define MyAppPublisher "Jan Smolders"
#define MyAppURL "http://www.mediacenterjs.com/"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{099E345D-AB6D-47DA-ABEA-BB7DBB59B8D4}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputBaseFilename=setup
SetupIconFile=C:\Users\jan.smolders\Documents\GitHub\mediacenterjs\public\core\favicon.ico
Compression=lzma
SolidCompression=yes
LicenseFile=C:\Users\jan.smolders\Documents\GitHub\mediacenterjs-windows\innosetup\gpl-3.0.txt
InfoBeforeFile=C:\Users\jan.smolders\Documents\GitHub\mediacenterjs-windows\innosetup\readme.txt
ChangesEnvironment = yes   
PrivilegesRequired = admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "C:\Users\jan.smolders\Documents\GitHub\mediacenterjs\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Permissions: everyone-full; 
Source: "C:\Users\jan.smolders\Documents\GitHub\mediacenterjs\package.json"; DestDir: "{app}"; Flags: ignoreversion; AfterInstall:LaunchApplication();

[Icons]
Name: "{group}\mediacenterjs"; Filename: "{app}\mediacenterjs.exe";

[Registry]
; set PATH
Root: HKCU; Subkey: "Environment"; ValueType:string; ValueName:"PATH"; ValueData:"{olddata};{app}\bin\ffmpeg"; Flags: preservestringtype;

; NPM install rest of dependencies
[Code]
procedure LaunchApplication();
  var
    C, P, D: String; E:Integer;
  begin
    C:= 'npm';
    P:= 'install';
    D:= ExpandConstant('{app}');
    if not ShellExec('', C, P, D, SW_SHOW, ewWaitUntilTerminated, E) then begin
      E:= -1;
    end;
  end;
end.

; Add Firewall Rules for NodeJs
;Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""Node In"" program=""{pf64}\nodejs\node.exe"" dir=in action=allow enable=yes"; Flags: runhidden;
;Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""Node Out"" program=""{pf64}\nodejs\node.exe"" dir=out action=allow enable=yes"; Flags: runhidden;

[UninstallRun]
; Remove all leftovers
Filename: "{sys}\rmdir"; Parameters: "-r ""{app}""";
