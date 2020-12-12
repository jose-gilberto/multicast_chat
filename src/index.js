const dgram = require('dgram');
const config = require('./config');
const readline = require('readline');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const mCastIp = '224.0.255.255';
const client = dgram.createSocket('udp4');

const key = config.KEY;

const resizedIv = Buffer.allocUnsafe(16);
const iv = crypto.createHash('sha256').update('hashedIv').digest();
iv.copy(resizedIv);

const encrypt = (text) => {
  const eKey = crypto.createHash('sha256')
                     .update(key).digest();
  const cipher = crypto.createCipheriv('aes256', eKey, resizedIv);
  
  let msg = cipher.update(text, 'utf8', 'hex');
  msg += cipher.final('hex');

  return msg;
}

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
  // // client.setBroadcast(true);
  // client.setMulticastTTL(128);
  
  // client.addMembership(mCastIp);

  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  r1.setPrompt('Digite sua mensagem (.exit para sair): \n');
  r1.prompt();

  r1.on('line', line => {
    if (line === '.exit') {
      process.exit(0);
    } else {

      let msg = encrypt(line);
      
      // port 4696
      // port config.PORT
      msg = Buffer.from(msg, 'hex');
      client.send(msg, 0, msg.length, config.PORT, mCastIp, err => {
        if (err) console.error(err);
        console.log('Message sended!');
      });
    }
  }).on('close', _ => {
    process.exit(0);
  });
});

client.on('message', (message, remote) => {
  if (remote.address !== '192.168.0.104' && remote.address !== '127.0.0.1')
    console.log(`\n${remote.address}> - ${decrypt(message.toString('hex'))}`);
});

client.bind(config.PORT, () => {
  // client.setBroadcast(true);
  client.setMulticastTTL(128);
  client.addMembership(mCastIp, '192.168.0.104');
});