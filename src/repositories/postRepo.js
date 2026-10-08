import pool from '../db/db.js';

// Maps the API's sortBy values to real column names. Only values from this
// map are ever placed into ORDER BY, so user input never reaches the SQL text.
const SORT_COLUMNS = {
  id: 'id',
  title: 'title',
  content: 'content',
  createdAt: 'created_at',
};

// Aliasing created_at keeps the response shape the same as before (createdAt).
const COLUMNS = 'id, title, content, created_at AS "createdAt"';

export async function getAll({ search, sortBy, order, offset, limit }) {
  const params = [];
  let where = '';

  if (search) {
    // Escape LIKE wildcards so the search stays a literal substring match.
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    where = `WHERE title ILIKE $${params.length} OR content ILIKE $${params.length}`;
  }

  const column = Object.hasOwn(SORT_COLUMNS, sortBy)
    ? SORT_COLUMNS[sortBy]
    : 'id';
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  // id as a tie-breaker keeps page boundaries stable when sort values repeat.
  params.push(limit, offset);
  const sql = `
    SELECT ${COLUMNS} FROM posts
    ${where}
    ORDER BY ${column} ${direction}, id ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function getById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM posts WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function create(postData) {
  const { rows } = await pool.query(
    `INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING ${COLUMNS}`,
    [postData.title, postData.content],
  );
  return rows[0];
}

export async function update(id, updatedData) {
  // pg sends undefined as NULL, and COALESCE keeps the current value for any
  // field the client did not provide.
  const { rows } = await pool.query(
    `UPDATE posts
     SET title = COALESCE($1, title), content = COALESCE($2, content)
     WHERE id = $3
     RETURNING ${COLUMNS}`,
    [updatedData.title, updatedData.content, id],
  );
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1', [
    id,
  ]);
  return rowCount > 0;
}
