import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const jwtSecret = process.env.SECRET_KEY;

const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const checkAuthForUpload = async (req) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return false;
    }
    const token = authorization.replace("Bearer ", "");
    if (!token) {
        return false;
    }
    var jwtUser;
    try {
        jwtUser = jwt.verify(token, jwtSecret);
    } catch (e) {
        return false;
    }
    if (!jwtUser) {
        return false;
    }
    const user = await prisma.user.findUnique({
        where: {
            id: jwtUser.id,
            email: jwtUser.email,
        },
    });
    if (!user) {
        return false;
    }
    if (!user.isVerified) {
        return false;
    }
    if (jwtUser.iat <= user.passwordUpdatedAt.getTime() / 1000) {
        return false;
    }
    const otpRedisId = `password-otp:${user.email}`;
    const passwordChangeRedisId = `allow-password-change:${user.email}`;
    const resetReqExists =
        (await redis.exists(otpRedisId)) ||
        (await redis.exists(passwordChangeRedisId));
    if (resetReqExists) {
        return false;
    }
    user.password = undefined;
    return user;
};

export { checkAuthForUpload };
