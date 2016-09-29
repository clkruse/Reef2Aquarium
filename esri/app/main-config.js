function loadJS(url, isExternal) {
  if (isExternal) {
    url = document.location.protocol == 'file:' ? 'http:' + url : url;
  }
  else {
    url += '?v=' + app.version + (!app.isProduction ? '&_=' + new Date().getTime() : '');
  }

  // jshint -W060
  document.write('<script language=\'javascript\' type=\'text/javascript\' src=\'' + url + '\'><\/script>');
}

function loadCSS(url, isExternal) {
  if (isExternal) {
    url = document.location.protocol == 'file:' ? 'http:' + url : url;
  }
  else {
    url += '?v=' + app.version + (!app.isProduction ? '&_=' + new Date().getTime() : '');
  }

  var el = document.createElement('link');

  el.setAttribute('rel', 'stylesheet');
  el.setAttribute('type', 'text/css');
  el.setAttribute('href', url);
  document.getElementsByTagName('head')[0].appendChild(el);
}

function getUrlVar(name) {
  var vars = [], hash;

  if (window.location.href.indexOf('?') == -1) {
    return null;
  }

  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    hash[0] = hash[0].split('#')[0];
    vars.push(hash[0]);
    vars[hash[0]] = (hash[1] === undefined) ? true : hash[1];
  }
  return vars[name];
}

function defineDojoConfig() {
  var path1 = location.pathname.replace(/\/[^/]+$/, '/'),
      path2 = location.pathname.replace(/\/[^/]+$/, ''),
      path3 = location.pathname.replace(/\/src\/[^/]*$/, '/');

  window.dojoConfig = {
    parseOnLoad: true,
    async: ! app.isProduction,
    isDebug: false,
    useDeferredInstrumentation: true,
    /*cacheBust: ! app.isProduction,*/
    packages: [
      {
        name: 'storymaps',
        location: path1 + 'app/storymaps'
      },
      {
        name: 'storymaps-react',
        location: path3 + 'build/app/storymaps'
      },
      {
        name: 'lib',
        location: path1 + 'lib'
      },
      {
        name: 'templateConfig',
        // If the application is deployed on a Portal (apps path contains /apps/MapSeries/ or /home/MapSeries/)
        // commonConfig.js is loaded from the parent folder, otherwise it's loaded from the app folder
        location: (/(\/)([a-zA-Z0-9]+(\/))*(apps\/|home\/)([a-zA-Z0-9]+\/)/).test(document.location.pathname) ? path2.substr(0,path2.lastIndexOf('/MapSeries')) : path2.replace(/\/+$/, '') + '/app'
      },
      {
        name: 'lib-build',
        location: path1 + 'lib-build'
      },
      {
        name: 'commonResources',
        location: path1 + (app.isProduction ? 'resources/common' : 'app/storymaps/common/_resources/')
      },
      {
        name: 'resources',
        location: path1 + 'resources/'
      },
      {
        name: 'esri4',
        location: app.pathJSAPI4 + 'esri'
      }
    ],
    aliases: [
      ['text', 'lib-build/text'],
      ['lib-build/i18n', 'dojo/i18n'],
      ['underscore', 'lib-build/lodash'],
      ['react', 'lib/react/react'],
      ['react-dom', 'lib/react/react-dom'],
      ['redux', 'lib/redux/index'],
      ['react-redux', 'lib/react-redux/index'],
      ['react-bootstrap', 'lib/react-bootstrap/react-bootstrap']
    ]
  };
}

app.isProduction = true;

defineDojoConfig();
window.dojoConfig.locale = 'en';

app.isInBuilder = getUrlVar('edit') || getUrlVar('fromScratch') || getUrlVar('fromscratch');
app.indexCfg = configOptions; // eslint-disable-line no-undef

app.isInBuilder = !! app.isInBuilder;

loadCSS(app.pathJSAPI3 + 'esri/css/esri.css', true);
loadCSS(app.pathJSAPI3 + 'dijit/themes/claro/claro.css', true);

if (app.isProduction) {
  if (app.isInBuilder) {
    loadCSS('app/builder-min.css');
  }
  else {
    loadCSS('app/viewer-min.css');
  }
}

if (navigator.appName.indexOf('Internet Explorer') != -1) {
  var badBrowser = (
    navigator.appVersion.indexOf('MSIE 9') == -1 && //v9 is ok
    navigator.appVersion.indexOf('MSIE 1') == -1 //v10, 11, 12, etc. is fine too
  );

  if (badBrowser) {
    document.querySelector('#fatalError .error-title').innerHTML = 'Sorry!';
    document.querySelector('#fatalError .error-msg').innerHTML = 'This story is not supported in Internet Explorer before version 10. <a href="http://browsehappy.com/" target="_blank">Please update your browser</a>';
    document.querySelector('#fatalError').style.display = 'block';
  }
}

if (app.isProduction) {
  window.dojoConfig.aliases.push(['Handlebars', 'handlebars.runtime']);
}
else {
  window.dojoConfig.aliases.push(['Handlebars', 'lib-build/hbs/handlebars.js']);
}

loadJS(app.pathJSAPI3 + 'init.js', true);
loadJS('app/config.js');

if (app.isProduction) {
  _ = {}; // eslint-disable-line no-undef

  if (app.isInBuilder) {
    loadJS('app/builder-min.js');
  }
  else {
    loadJS('app/viewer-min.js');
  }
}

if (document.location.protocol == 'file:') {
  $(document).ready(function() {
    $('#fatalError .error-title').html('Application loading failed');
    $('#fatalError .error-msg').html('The application has to be accessed through a web server. Consult user guide for detail.');
    $('#fatalError').show();
  });
}
else {
  loadJS('app/main-app.js');
}

// Enable Google Analytics on storymaps.esri.com
if (window.location.href.toLowerCase().indexOf('storymaps.esri.com') >= 0) {
  var _gaq = _gaq || [];

  _gaq.push(['_setAccount', 'UA-26529417-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script');

    ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];

    s.parentNode.insertBefore(ga, s);
  })();
}
