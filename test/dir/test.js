window.addEventListener('load', onVrViewLoad)
function onVrViewLoad() {
  var vrView = new VRView.Player('#vrview', {
    video: 'clkruse.github.io/test/congo_2048.mp4',
    is_stereo: true
  });
}
