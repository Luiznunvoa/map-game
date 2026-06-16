try {
    const u16 = new Uint16Array(undefined, undefined, NaN);
    console.log("length:", u16.length);
} catch (e) {
    console.error(e.message);
}
