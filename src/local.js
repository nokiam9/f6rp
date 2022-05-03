(async function () {
    const lists = await f6rp.util.addFile('src/files.json');

    for (const list of lists) {
        await Promise.all(
            list.map(
                info => f6rp.util.addFile(info.src).then(res => {
                    f6rp.log(`Loaded ${info.src}`);
                    if (info.saveAs) {
                        f6rp.util.set(f6rp, info.saveAs, res);
                    }
                }),
            ),
        );
    }

}().then(function () {
    f6rp.log('F6RP loaded');
}).catch(function (e) {
    f6rp.log('F6RP load error!');
    throw e;
}));