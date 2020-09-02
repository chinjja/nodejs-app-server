import jwt from 'jsonwebtoken';

export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: jwt.Secret,
    options: jwt.SignOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
            if (err) {
                reject(err);
            } else if (token) {
                resolve(token);
            } else {
                reject('token is undefined');
            }
        });
    });
}

export function verify(
    token: string,
    secretOrPublicKey: jwt.Secret | jwt.GetPublicKeyOrSecret,
    options?: jwt.VerifyOptions): Promise<object> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPublicKey, options, async (err, decoded) => {
            if (err) {
                reject(err);
            } else if (decoded) {
                resolve(decoded);
            } else {
                reject('decoded value is undefined');
            }
        });
    });
}

export function decode(token: string) {
    return jwt.decode(token);
}