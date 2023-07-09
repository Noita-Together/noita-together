import 'dart:convert';
import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'package:flutter/services.dart' show rootBundle;
import 'package:nt_app/utils/nt_updater.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:nt_server_api/api.dart';

import 'interfaces/twitch_tokens.dart';

class ApiClientDev extends ApiClient {
  ApiClientDev({
    super.basePath = 'http://localhost:3000/api',
    super.authentication,
  });
}

final ntApi = AuthenticationApi(ApiClientDev());

final Uri _noitaTogetherHomePage =
    Uri.parse('https://noita-together.skyefullofbreeze.com');
const _noitaTogetherLogin =
    "https://noita-together.skyefullofbreeze.com/api/auth/login";
final Uri _noitaTogetherWsStatus =
    Uri.parse('ws://noita-together.skyefullofbreeze.com/uptime');
final Uri _noitaTogetherWsDeviceAuth =
    Uri.parse('ws://localhost:5466/deviceAuth');

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
          // This is the theme of your application.
          //
          // TRY THIS: Try running your application with "flutter run". You'll see
          // the application has a blue toolbar. Then, without quitting the app,
          // try changing the seedColor in the colorScheme below to Colors.green
          // and then invoke "hot reload" (save your changes or press the "hot
          // reload" button in a Flutter-supported IDE, or press "r" if you used
          // the command line to start the app).
          //
          // Notice that the counter didn't reset back to zero; the application
          // state is not lost during the reload. To reset the state, use hot
          // restart instead.
          //
          // This works for code too, not just values: Most code changes can be
          // tested with just a hot reload.
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(centerTitle: true)),
      home: const MyHomePage(title: 'Noita Together'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;
  TwitchTokens? twitchTokens;
  bool fetchedLoginFromDisk = false;
  String? wsMessage;
  WebSocketChannel? authChannel;
  String? gamePath;
  bool fetchingGamePath = true;

  @override
  void initState() {
    super.initState();
    _getPrefs().then((SharedPreferences value) async {
      if (!value.containsKey('auth')) null;
      String tokens = value.getString('auth')!;
      setState(() {
        var twitchTokensTmp = TwitchTokens.fromJSON(jsonDecode(tokens));
        ntApi
            .authRefreshPost(authorization: "Bearer ${twitchTokensTmp.refresh}")
            .then((value) {
          twitchTokensTmp.access = value?.token;
          twitchTokensTmp.expiresIn = int.parse(value?.expiresIn ?? '0');
          setState(() {
            twitchTokens = twitchTokensTmp;
          });
        });
      });
    }).catchError((e) {
      print(e);
    }).then((_) async {
      setState(() {
        fetchedLoginFromDisk = true;
      });
    });
    getGamePath().then((value) {
      setState(() {
        fetchingGamePath = false;
        gamePath = value;
      });
    });
  }

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }

  void _onServerStatusClicked() {
    _launchUrl(_noitaTogetherHomePage);
  }

  void _onLogin() {
    WebSocketChannel channel =
        WebSocketChannel.connect(_noitaTogetherWsDeviceAuth);
    channel.stream.listen(
      (data) {
        print(data);
        var json = jsonDecode(data);
        switch (json['type']) {
          case 'deviceCode':
            _launchUrl(Uri.parse(
                "${json['data']['loginServer']}/api/auth/login?deviceCode=${json['data']['deviceCode']}"));
            break;
          case 'authenticationTokens':
            var data = json['data'];
            var tokens = TwitchTokens();
            tokens.access = data["access"];
            tokens.refresh = data["refresh"];
            tokens.expiresIn = data["expiresIn"];
            tokens.createdOn = DateTime.now().millisecond;

            authChannel?.sink.close();
            setState(() {
              authChannel = null;
              twitchTokens = tokens;
            });
            _getPrefs().then((value) => value.setString(
                'auth', jsonEncode(tokens.toRefreshTokenJson())));
            break;
        }
      },
      onError: (error) => print(error),
    );
    setState(() {
      authChannel = channel;
    });
  }

  void _onLogout() {
    _getPrefs().then((value) => value.clear());
    setState(() {
      twitchTokens = null;
    });
  }

  Future<void> _launchUrl(Uri url) async {
    if (!await launchUrl(url)) {
      throw Exception('Could not launch $url');
    }
  }

  Future<SharedPreferences> _getPrefs() async {
    return await SharedPreferences.getInstance();
  }

  Widget renderLoginButton(BuildContext context) {
    if (!fetchedLoginFromDisk) return const Text('Fetching Login');
    if (twitchTokens != null) {
      return TextButton(onPressed: _onLogout, child: const Text('Log Out'));
    }
    if (authChannel != null) return const Text('Logging In');
    return TextButton(onPressed: _onLogin, child: const Text('Log In'));
  }

  Future<void> openFilePickerAndSave() async {
    openFilePicker().then((value) => {
          setState(() {
            gamePath = value;
          })
        });
  }

  Widget renderGamepathInfo(BuildContext context) {
    if (fetchingGamePath) return const Text("Fetching game path");
    if (((gamePath?.length ?? 0) > 0)) return Text(gamePath!);

    return AlertDialog(
      shape: BeveledRectangleBorder(
        borderRadius: BorderRadius.circular(1),
        side: const BorderSide(
          color: Colors.deepOrange,
          style: BorderStyle.solid
        )
      ),
      elevation: 8,

      title: const Text('Unable to locate game path automatically'),
      content: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text("Please select an option below")
        ],
      ),
      actions: [
        TextButton(
          onPressed: openFilePickerAndSave,
          child: const Text('Choose path'),
        ),
        TextButton(
          onPressed: (){exit(0);},
          child: const Text('Exit NT'),
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // TRY THIS: Try changing the color here to a specific color (to
        // Colors.amber, perhaps?) and trigger a hot reload to see the AppBar
        // change color while the other colors stay the same.
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
        actions: [
          TextButton(
              onPressed: _onServerStatusClicked,
              child: const Text('Server Status')),
          renderLoginButton(context),
          const Image(image: AssetImage('assets/icon.png')),
        ],
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also a layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          //
          // TRY THIS: Invoke "debug painting" (choose the "Toggle Debug Paint"
          // action in the IDE, or press "p" in the console), to see the
          // wireframe for each widget.
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[renderGamepathInfo(context)],
        ),
      )
    );
  }
}
