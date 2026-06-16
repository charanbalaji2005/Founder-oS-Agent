let nativeCrypto;
try {
  nativeCrypto = eval('require')('crypto');
} catch (e) {}

module.exports = nativeCrypto || {
  randomUUID: () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ (typeof crypto !== 'undefined' ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.random() * 16) & 15 >> c / 4).toString(16)
    );
  }
};
