import { randomInt } from "node:crypto";

const generateOtp = async () => {
    return randomInt(100000, 999999);
};

const randomNum = async (numLen = 6) => {
    return randomInt(Math.pow(10, numLen - 1), Math.pow(10, numLen));
};

export { generateOtp, randomNum };
