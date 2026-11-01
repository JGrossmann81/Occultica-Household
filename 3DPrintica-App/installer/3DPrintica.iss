[Setup]
AppName=3DPrintica
AppVersion=1.0
AppPublisher=3lite Studios
DefaultDirName={autopf}\3DPrintica
DefaultGroupName=3DPrintica
OutputDir=..\Output
OutputBaseFilename=3DPrintica-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
SetupIconFile=..\3DPrintica.ico
UninstallDisplayIcon={app}\3DPrintica.exe
WizardStyle=modern

[Files]
Source: "..\dist\3DPrintica\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\3DPrintica"; Filename: "{app}\3DPrintica.exe"
Name: "{group}\3DPrintica (shop mode)"; Filename: "{app}\3DPrintica.exe"; Parameters: "--shop"
Name: "{autodesktop}\3DPrintica"; Filename: "{app}\3DPrintica.exe"

[Run]
Filename: "{app}\3DPrintica.exe"; Description: "Open 3DPrintica"; Flags: nowait postinstall skipifsilent
