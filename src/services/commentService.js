import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../repositories/commentRepo.js';

export async function getAllComments(options) {
  return await getAll(options);
}

export async function getCommentById(id) {
  const comment = await getById(id);
  if (comment) return comment;
  else {
    const error = new Error(`Comment ${id} not found`);
    error.status = 404;
    throw error;
  }
}

export async function createComment(data) {
  const newComment = await create(data);
  // The repository returns null when PostgreSQL rejects the INSERT because
  // the referenced post does not exist (foreign key violation).
  if (newComment === null) {
    const error = new Error(
      `Cannot create comment: referenced post with id ${data.postId} does not exist`,
    );
    error.status = 400;
    throw error;
  }
  return newComment;
}

export async function updateComment(id, data) {
  const updatedComment = await update(id, data);
  if (updatedComment) return updatedComment;
  else {
    const error = new Error(`Comment ${id} not found`);
    error.status = 404;
    throw error;
  }
}

export async function deleteComment(id) {
  const result = await remove(id);
  if (result) return;
  else {
    const error = new Error(`Comment ${id} not found`);
    error.status = 404;
    throw error;
  }
}
