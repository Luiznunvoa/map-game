import { unpack, pack } from 'msgpackr';
import { readFileSync } from 'fs';

// simulate the []byte from backend
const data = new Uint8Array([1, 0, 2, 0, 3, 0]);
const packed = pack({ idBuffer: data });

const unpacked = unpack(packed);
console.log(unpacked.idBuffer.constructor.name);
console.log(unpacked.idBuffer);
const u16 = new Uint16Array(unpacked.idBuffer.buffer, unpacked.idBuffer.byteOffset, unpacked.idBuffer.byteLength / 2);
console.log(u16);
