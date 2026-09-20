window.AURORA_PHOTO_MAP = { byId: {}, byName: {} };
window.GIMARRY_PHOTO_MAP = window.AURORA_PHOTO_MAP;

(function () {
  window.lookupKnownPhoto = function () { return ''; };
  window.resolveItemImage = function (item) {
    return String(item?.image || '').trim();
  };
})();
