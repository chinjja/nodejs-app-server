import bcrypt from 'bcrypt-nodejs';

export function genSalt(rounds = 10) {
    return new Promise<string>((resolve, reject) => {
        bcrypt.genSalt(rounds, (error, result) => {
            if(error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export function hash(password: string, salt?: string) {
    return new Promise<string>(async (resolve, reject) => {
        if(typeof salt == 'undefined') {
            salt = await genSalt();
        }
        bcrypt.hash(password, salt, null, (error, result) => {
            if(error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export function compare(password: string, hash: string) {
    return new Promise<boolean>((resolve, reject) => {
        bcrypt.compare(password, hash, (error, ok) => {
            if(error) {
                reject(error);
            } else {
                resolve(ok);
            }
        });
    });
}