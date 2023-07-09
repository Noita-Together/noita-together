import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:file_picker/file_picker.dart';

Future<SharedPreferences> _getPrefs() async {
  return await SharedPreferences.getInstance();
}

Future<String> getGamePath() async {
  var gamePathMaybe = await _getPrefs().then((value) => value.getString("gamePath"));
  if(gamePathMaybe != null && File.fromUri(Uri.parse(gamePathMaybe)).existsSync()) return gamePathMaybe;
  if (Platform.isWindows) {
    List<String> gamePaths = [];
    ProcessResult resultSteam = await Process.run('powershell.exe', [
      '(Get-Item "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 881100").GetValue("InstallLocation")',
    ]);
    ProcessResult resultGoG = await Process.run('powershell.exe', [
      '(Get-Item "HKLM:\\SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1310457090").GetValue("path")',
    ]);
    String outputSteam = resultSteam.stdout as String;
    String outputGog = resultGoG.stdout as String;
    gamePaths.add(outputSteam.trim());
    gamePaths.add(outputGog.trim());
    String gamePath = gamePaths.isNotEmpty ? gamePaths.first : '';
    print(gamePath);
    await _getPrefs().then((value) => value.setString("gamePath", gamePath));
    return gamePath;
  } else if (Platform.isLinux) {
    List<String> linuxPaths = [
      '${await getApplicationDocumentsDirectory()}/.steam/steam/steamapps/common/Noita',
      '${await getApplicationDocumentsDirectory()}/.local/share/Steam/steamapps/common/Noita/',
    ];

    bool foundNoita = false;
    for (String path in linuxPaths) {
      if (await File(path).exists()) {
        foundNoita = true;
        print(path);
        await _getPrefs().then((value) => value.setString("gamePath", path));
        return path;
      }
    }

    if (!foundNoita) {
      return '';
    }
  }

  return '';
}

Future<String?> openFilePicker() async {
  String? result = await FilePicker.platform.getDirectoryPath();

  if (result != null) {
    String? filePath = result;

    await _getPrefs().then((value) => value.setString("gamePath", filePath));
    return filePath;
  }
  // User canceled the file picker
  return null;
}

