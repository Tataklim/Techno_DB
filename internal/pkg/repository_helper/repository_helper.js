export const query = async (pool, str, data) => {
    const client = await pool.connect();
    let res = {};
    try {
        res = await client.query(str, data);
    } finally {
        client.release();
    }
    return res;
};
