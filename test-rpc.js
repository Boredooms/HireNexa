const https = require('https');

const testRPC = (url, name) => {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log(`\nTesting ${name}:`);
  console.log(`URL: ${url}`);

  const req = https.request(url, options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        const chainIdHex = response.result;
        const chainIdDecimal = parseInt(chainIdHex, 16);
        console.log(`Chain ID (hex): ${chainIdHex}`);
        console.log(`Chain ID (decimal): ${chainIdDecimal}`);
      } catch (error) {
        console.log('Error:', error.message);
        console.log('Response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.log('Request error:', error.message);
  });

  req.write(data);
  req.end();
};

// Test Celo Sepolia RPC
testRPC('https://forno.celo-sepolia.celo-testnet.org', 'Celo Sepolia');

// Wait a bit then test Alfajores
setTimeout(() => {
  testRPC('https://alfajores-forno.celo-testnet.org', 'Celo Alfajores');
}, 2000);
