import { unpack } from 'msgpackr';
import fs from 'fs';

// Check if we can read the sqlite DB to get the map data, or just use Go to dump the msgpack to a file.
