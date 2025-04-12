function UTCOffsetToNumber(UTCOffset: string): number {
    // Input format UTC+00:00
    const tzText = UTCOffset.replace("UTC", "").split(":")[0]
    return parseInt(tzText);
}

const UTC_OFFSETS = [
    "UTC-12:00",
    "UTC-11:00",
    "UTC-10:00",
    //"UTC-09:30",
    "UTC-09:00",
    "UTC-08:00",
    "UTC-07:00",
    "UTC-06:00",
    "UTC-05:00",
    //"UTC-04:30",
    "UTC-04:00",
    "UTC-03:00",
    "UTC-02:00",
    "UTC-01:00",
    "UTC+00:00",
    "UTC+01:00",
    "UTC+02:00",
    "UTC+03:00",
    "UTC+04:00",
    // "UTC+04:30",
    "UTC+05:00",
    // "UTC+05:30",
    // "UTC+05:45",
    "UTC+06:00",
    // "UTC+06:30",
    "UTC+07:00",
    "UTC+08:00",
    // "UTC+08:45",
    "UTC+09:00",
    // "UTC+09:30",
    "UTC+10:00",
    // "UTC+10:30",
    "UTC+11:00",
    "UTC+12:00",
    // "UTC+12:45",
    "UTC+13:00",
    "UTC+14:00"
];

export {UTCOffsetToNumber, UTC_OFFSETS};
