import { unpack, pack } from 'msgpackr';

const data = new Uint8Array([1, 0, 2, 0, 3, 0]);
// Force an odd offset in the msgpack payload by adding a 2-byte string first
const packed = pack({ a: "12", idBuffer: data, b: "12" });

const unpacked = unpack(packed);
console.log("unpacked is Uint8Array?", unpacked.idBuffer instanceof Uint8Array);
console.log("byteOffset:", unpacked.idBuffer.byteOffset);
try {
    const u16 = new Uint16Array(unpacked.idBuffer.buffer, unpacked.idBuffer.byteOffset, unpacked.idBuffer.length / 2);
    console.log("Success:", u16);
} catch (e) {
    console.error("Error creating Uint16Array:", e.message);
}
