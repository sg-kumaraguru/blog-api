import { Comment } from "../models/commentModel.js";
import { BlogPost } from "../models/blogPostModel.js";
import { asyncHandler } from "../utils/asyncUtils.js";

export const createComment = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.postId);

  if (!post || post.status !== "published") {
    return res.status(404).json({
      error: "Post not found",
    });
  }

  const comment = await Comment.create({
    content: req.body.content,
    author: req.user._id,
    post: post._id,
  });

  const populatedComment = await Comment.findById(comment._id)
    .populate("author", "name");

  res.status(201).json(populatedComment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment)
    return res.status(404).json({ error: "Comment not found" });

  if (comment.author.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized" });

  await comment.deleteOne();

  res.json({ message: "Comment deleted" });
});

export const getMyComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ author: req.user._id })
    .populate("post", "title")
    .sort({ createdAt: -1 });

  res.json(
    comments.map(c => ({
      id: c._id,
      postId: c.post._id,
      postTitle: c.post.title,
      content: c.content,
      createdAt: c.createdAt,
    }))
  );
});
