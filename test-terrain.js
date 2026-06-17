import { unpack, pack } from 'msgpackr';
const packed = pack({ overrides: { "100": "plains" } });
const unpacked = unpack(packed);
console.log("type of overrides:", typeof unpacked.overrides);
console.log("overrides[100]:", unpacked.overrides[100]);
console.log("overrides['100']:", unpacked.overrides['100']);
