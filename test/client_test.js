const dgram = require('dgram');
const config = require('../src/config');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const mCastIp = '230.185.192.108';
const client = dgram.createSocket('udp4');

const key = config.KEY;
// const iv = config.IV;
const resizedIv = Buffer.allocUnsafe(16);
const iv = crypto.createHash('sha256').update('hashedIv').digest();
iv.copy(resizedIv);

const decrypt = (text) => {
  const eKey = crypto.createHash('sha256')
                     .update(key).digest();
  const decipher = crypto.createDecipheriv('aes256', eKey, resizedIv);

  let msg = decipher.update(text, 'hex', 'utf8')
  msg += decipher.final();

  return msg;
}

client.on('listening', _ => {
  const addr = client.address();
  
  console.log('UDP Client listing on ' + addr.address + ':' + addr.port);
  client.setBroadcast(true);
  client.setMulticastTTL(128);
  client.addMembership('230.185.192.108', '127.0.0.1');

});

client.on('message', (message, remote) => {
  
  // const msg = decrypt(message.toString('base64'));
  // const msg = decrypt(message.toString('hex'));

  console.log(`Message received from ${remote.address}:${remote.port} - ${message.toString('hex')}`);
  console.log(decrypt(message.toString('hex')));
});

client.bind(4696, 'localhost');