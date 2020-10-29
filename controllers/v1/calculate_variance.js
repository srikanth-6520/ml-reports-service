exports.variance = async function (req, res) {
    try {
        var difference = [];
        var data1 = req.body.data.data1;
        var data2 = req.body.data.data2;
        for (let i = 0; i < data1.length; i++) {
            var mydiff = parseFloat(((data2[i] - data1[i]) * 100 / data1[i]).toFixed(2));
            difference.push(mydiff);
        }
        res.status(200).json(difference);
    } catch (e) {
        console.log(e);
        res.status(500).json({ errMessage: 'Internal error. Please try again!!' });
    }
};
