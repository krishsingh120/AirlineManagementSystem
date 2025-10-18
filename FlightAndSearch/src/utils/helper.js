function compareTime(timeString1, timeString2){
    const dateTime1 = new Date(timeString1);
    const dateTime2 = new Date(timeString2);

    return dateTime1.getTime() > dateTime2.getTime();
}

module.exports = {
    compareTime
}