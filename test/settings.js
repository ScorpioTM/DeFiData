const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { readLibrarySettings } = require('../dist/settings/index.js');
const { getFallbackProvider } = require('../dist/helpers/getFallbackProvider.js');

function writeSettingsFile(settings) {
  try {
    fs.writeFileSync(path.resolve(process.cwd(), './defidata.json'), JSON.stringify(settings));
  } catch (err) {
    throw new Error("Can't write the custom settings file!");
  }
}

function removeSettingsFile() {
  try {
    fs.rmSync(path.resolve(process.cwd(), './defidata.json'));
  } catch (err) {
    throw new Error("Can't remove the custom settings file!");
  }
}

describe('Settings', function () {
  describe('Provided Settings', function () {
    describe('From the method parameter', function () {
      it('Can add a new network', function () {
        // Set the custom settings in the method parameter
        const settings = readLibrarySettings({
          [0]: {
            providers: ['https://test.rpc.com/'],
            multicall3: '0x0000000000000000000000000000000000000000',
            tokens: ['0x0000000000000000000000000000000000000001'],
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        });

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(0).with.be.an('object');
        expect(settings[0]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].providers[0]).to.be.equal('https://test.rpc.com/');
        expect(settings[0]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');
        expect(settings[0]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');
        expect(settings[0]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[0].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[0].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[0].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[0].exchanges[0]).to.have.property('fee').with.be.equal(25);
      });

      it('Can override the providers', function () {
        // Set the custom settings in the method parameter
        const settings = readLibrarySettings({
          [56]: {
            providers: ['https://test.rpc.com/']
          }
        });

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].providers[0]).to.be.equal('https://test.rpc.com/');
      });

      it('Can override the multicall3 address', function () {
        // Set the custom settings in the method parameter
        const settings = readLibrarySettings({
          [56]: {
            multicall3: '0x0000000000000000000000000000000000000000'
          }
        });

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');
      });

      it('Can override the base tokens', function () {
        // Set the custom settings in the method parameter
        const settings = readLibrarySettings({
          [56]: {
            tokens: ['0x0000000000000000000000000000000000000001']
          }
        });

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');
      });

      it('Can override the exchanges', function () {
        // Set the custom settings in the method parameter
        const settings = readLibrarySettings({
          [56]: {
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        });

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[56].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[56].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[56].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[56].exchanges[0]).to.have.property('fee').with.be.equal(25);
      });
    });

    describe('From the `global` object', function () {
      it('Can add a new network', function () {
        // Set the custom settings in the `global` object
        global.DEFIDATA_SETTINGS = {
          [0]: {
            providers: ['https://test.rpc.com/'],
            multicall3: '0x0000000000000000000000000000000000000000',
            tokens: ['0x0000000000000000000000000000000000000001'],
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        };

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(0).with.be.an('object');
        expect(settings[0]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].providers[0]).to.be.equal('https://test.rpc.com/');
        expect(settings[0]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');
        expect(settings[0]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');
        expect(settings[0]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[0].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[0].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[0].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[0].exchanges[0]).to.have.property('fee').with.be.equal(25);

        // Remove the `global` object
        global.DEFIDATA_SETTINGS = undefined;
      });

      it('Can override the providers', function () {
        // Set the custom settings in the `global` object
        global.DEFIDATA_SETTINGS = {
          [56]: {
            providers: ['https://test.rpc.com/']
          }
        };

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].providers[0]).to.be.equal('https://test.rpc.com/');

        // Remove the `global` object
        global.DEFIDATA_SETTINGS = undefined;
      });

      it('Can override the multicall3 address', function () {
        // Set the custom settings in the `global` object
        global.DEFIDATA_SETTINGS = {
          [56]: {
            multicall3: '0x0000000000000000000000000000000000000000'
          }
        };

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');

        // Remove the `global` object
        global.DEFIDATA_SETTINGS = undefined;
      });

      it('Can override the base tokens', function () {
        // Set the custom settings in the `global` object
        global.DEFIDATA_SETTINGS = {
          [56]: {
            tokens: ['0x0000000000000000000000000000000000000001']
          }
        };

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');

        // Remove the `global` object
        global.DEFIDATA_SETTINGS = undefined;
      });

      it('Can override the exchanges', function () {
        // Set the custom settings in the `global` object
        global.DEFIDATA_SETTINGS = {
          [56]: {
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        };

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[56].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[56].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[56].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[56].exchanges[0]).to.have.property('fee').with.be.equal(25);

        // Remove the `global` object
        global.DEFIDATA_SETTINGS = undefined;
      });
    });

    describe('From the `defidata.json` configuration file', function () {
      it('Can add a new network', function () {
        // Set the custom settings in the `defidata.json` configuration file
        writeSettingsFile({
          [0]: {
            providers: ['https://test.rpc.com/'],
            multicall3: '0x0000000000000000000000000000000000000000',
            tokens: ['0x0000000000000000000000000000000000000001'],
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        });

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(0).with.be.an('object');
        expect(settings[0]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].providers[0]).to.be.equal('https://test.rpc.com/');
        expect(settings[0]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');
        expect(settings[0]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');
        expect(settings[0]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[0].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[0].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[0].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[0].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[0].exchanges[0]).to.have.property('fee').with.be.equal(25);

        // Remove the `defidata.json` configuration file
        removeSettingsFile();
      });

      it('Can override the providers', function () {
        // Set the custom settings in the `defidata.json` configuration file
        writeSettingsFile({
          [56]: {
            providers: ['https://test.rpc.com/']
          }
        });

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('providers').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].providers[0]).to.be.equal('https://test.rpc.com/');

        // Remove the `defidata.json` configuration file
        removeSettingsFile();
      });

      it('Can override the multicall3 address', function () {
        // Set the custom settings in the `defidata.json` configuration file
        writeSettingsFile({
          [56]: {
            multicall3: '0x0000000000000000000000000000000000000000'
          }
        });

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('multicall3').with.be.equal('0x0000000000000000000000000000000000000000');

        // Remove the `defidata.json` configuration file
        removeSettingsFile();
      });

      it('Can override the base tokens', function () {
        // Set the custom settings in the `defidata.json` configuration file
        writeSettingsFile({
          [56]: {
            tokens: ['0x0000000000000000000000000000000000000001']
          }
        });

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('tokens').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].tokens[0]).to.be.equal('0x0000000000000000000000000000000000000001');

        // Remove the `defidata.json` configuration file
        removeSettingsFile();
      });

      it('Can override the exchanges', function () {
        // Set the custom settings in the `defidata.json` configuration file
        writeSettingsFile({
          [56]: {
            exchanges: [
              {
                name: 'Test',
                router: '0x0000000000000000000000000000000000000002',
                factory: '0x0000000000000000000000000000000000000003',
                initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                fee: 25
              }
            ]
          }
        });

        // Read the provided settings
        const settings = readLibrarySettings();

        // Check the return
        expect(settings).to.be.an('object');
        expect(settings).to.have.property(56).with.be.an('object');
        expect(settings[56]).to.have.property('exchanges').with.be.an('array').with.a.lengthOf(1);
        expect(settings[56].exchanges[0]).to.have.property('name').with.be.equal('Test');
        expect(settings[56].exchanges[0])
          .to.have.property('router')
          .with.be.equal('0x0000000000000000000000000000000000000002');
        expect(settings[56].exchanges[0])
          .to.have.property('factory')
          .with.be.equal('0x0000000000000000000000000000000000000003');
        expect(settings[56].exchanges[0])
          .to.have.property('initCodeHash')
          .with.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(settings[56].exchanges[0]).to.have.property('fee').with.be.equal(25);

        // Remove the `defidata.json` configuration file
        removeSettingsFile();
      });
    });
  });

  describe('Default Settings', function () {
    // Read the default settings
    const DEFAULT_SETTINGS = readLibrarySettings();

    Object.keys(DEFAULT_SETTINGS).forEach((networkId) => {
      describe('Network #' + networkId, function () {
        it('Must be a valid object', function () {
          expect(DEFAULT_SETTINGS[networkId]).to.be.an('object');
        });

        describe('Providers', function () {
          it('Must be a valid array', function () {
            expect(DEFAULT_SETTINGS[networkId].providers).to.be.an('array');
          });

          it('Must have only unique providers', function () {
            // Check for duplicates
            expect(new Set(DEFAULT_SETTINGS[networkId].providers).size === DEFAULT_SETTINGS[networkId].providers.length)
              .to.be.true;
          });

          // Get the fallback provider
          const provider = getFallbackProvider(DEFAULT_SETTINGS[networkId].providers);

          it('Must have only valid providers', function () {
            expect(provider instanceof ethers.FallbackProvider).to.be.true;
          });

          it('Must connect to the correct network', async function () {
            expect(Number((await provider.getNetwork()).chainId)).to.be.equal(parseInt(networkId));
          });
        });

        describe('Tokens', function () {
          it('Must be a valid array', function () {
            expect(DEFAULT_SETTINGS[networkId].tokens).to.be.an('array');
          });

          it('Must have only unique tokens', function () {
            // Check for duplicates
            expect(new Set(DEFAULT_SETTINGS[networkId].tokens).size === DEFAULT_SETTINGS[networkId].tokens.length).to.be
              .true;
          });

          it('Must have only valid tokens', function () {
            DEFAULT_SETTINGS[networkId].tokens.forEach((token) => {
              // Check if the token is valid
              expect(token).to.be.a.properAddress;

              // Check if token is formatted
              expect(token).to.be.equal(ethers.getAddress(token));
            });
          });
        });

        describe('Exchanges', function () {
          it('Must be a valid array', function () {
            expect(DEFAULT_SETTINGS[networkId].exchanges).to.be.an('array');
          });

          it('Must have only valid exchanges', function () {
            for (let i = 0; i < DEFAULT_SETTINGS[networkId].exchanges.length; i++) {
              const exchange = DEFAULT_SETTINGS[networkId].exchanges[i];

              // Check if is a valid object
              expect(exchange).to.be.an('object');

              // Check if the name is valid
              expect(exchange).to.have.a.property('name').with.be.an('string');

              // Check if name length is valid
              expect(exchange.name.length).to.be.lessThan(75);

              // Check if the router is valid
              expect(exchange).to.have.a.property('router').with.be.a.properAddress;

              // Check if router is formatted
              expect(exchange.router).to.be.equal(ethers.getAddress(exchange.router));

              // Check if the factory is valid
              expect(exchange).to.have.a.property('factory').with.be.a.properAddress;

              // Check if factory is formatted
              expect(exchange.factory).to.be.equal(ethers.getAddress(exchange.factory));

              // Check if the init-code hash is valid
              expect(exchange).to.have.a.property('initCodeHash').with.be.a.properHex(64);

              // Check if the fee is valid
              expect(exchange).to.have.a.property('fee').with.be.within(0, 250);
            }
          });
        });
      });
    });
  });
});
