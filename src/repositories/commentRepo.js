import pool from '../db/db.js';

// Maps the API's sortBy values to real column names. Only values from this
// map are ever placed into ORDER BY, so user input never reaches the SQL text.
const SORT_COLUMNS = {
  id: 'id',
  postId: 'post_id',
  content: 'content',
  createdAt: 'created_at',
};

// Aliasing keeps the response shape the same as before (postId, createdAt).
const COLUMNS = 'id, post_id AS "postId", content, created_at AS "createdAt"';

export async function getAll({ postId, search, sortBy, order, offset, limit }) {
  const params = [];
  const conditions = [];

  if (postId) {
    params.push(postId);
    conditions.push(`post_id = $${params.length}`);
  }

  if (search) {
    // Escape LIKE wildcards so the search stays a literal substring match.
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    conditions.push(`content ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const column = Object.hasOwn(SORT_COLUMNS, sortBy)
    ? SORT_COLUMNS[sortBy]
    : 'id';
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  // id as a tie-breaker keeps page boundaries stable when sort values repeat.
  params.push(limit, offset);
  const sql = `
    SELECT ${COLUMNS} FROM comments
    ${where}
    ORDER BY ${column} ${direction}, id ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function getById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM comments WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function create(data) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, content)
       VALUES ($1, $2)
       RETURNING ${COLUMNS}`,
      [data.postId, data.content],
    );
    return rows[0];
  } catch (err) {
    // 23503 = foreign_key_violation: the referenced post does not exist.
    if (err.code === '23503') return null;
    throw err;
  }
}

export async function update(id, updatedData) {
  const { rows } = await pool.query(
    `UPDATE comments SET content = $1 WHERE id = $2 RETURNING ${COLUMNS}`,
    [updatedData.content, id],
  );
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM comments WHERE id = $1', [
    id,
  ]);
  return rowCount > 0;
}
