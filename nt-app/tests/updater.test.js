const {buildURL} = require('../src/updater')

describe('test updater', () => {
    it('should test buildUrl', () => {
        let url = buildURL(0)
        expect(url).toBe('https://api.github.com/repos/Noita-Together/mod-core/releases/latest')
        let url2 = buildURL(1)
        expect(url2).toBe('https://api.github.com/repos/Noita-Together/mod-nemesis/releases/latest')
    });
});