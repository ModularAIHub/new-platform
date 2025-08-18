import bcrypt from 'bcrypt'

const hashPassword = async (password) => {
    const result = await bcrypt.hash(password, 10);
    return result
}

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

export { hashPassword, comparePassword }