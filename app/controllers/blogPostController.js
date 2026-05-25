import { BlogPost } from "../models/blogPostModel.js";
import { Comment } from "../models/commentModel.js";
import { asyncHandler } from "../utils/asyncUtils.js";
import { applySorting, applyPagination } from "../utils/apiFeatureUtils.js";

export const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags, action } = req.body;

  const status = action === "publish" ? "published" : "draft";

  const post = await BlogPost.create({
    title,
    content,
    tags,
    status,
    author: req.user._id,
  });

  res.status(201).json(post);
});

export const getPosts = asyncHandler(async (req, res) => {
  let query = BlogPost.find({ status: "published" }).populate("author", "name");

  // sorting
  query = applySorting( query, req.query.sort );

  // pagination
  const {
    query: paginatedQuery,
    pagination,
  } = applyPagination(
    query,
    req.query.page,
    req.query.limit
  );

  const posts = await paginatedQuery.lean();

  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await Comment.find({
        post: post._id,
      })
        .populate("author", "name")
        .sort({
          createdAt: -1,
        })
        .lean();

      return {
        ...post,
        comments,
      };
    })
  );

  const total =
    await BlogPost.countDocuments({
      status: "published",
    });

  res.json({
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(
      total / pagination.limit
    ),
    data: postsWithComments,
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);

  if (!post)
    return res.status(404).json({ error: "Post not found" });

  if (post.status !== "published") {
    if (!req.user || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
  }

  await post.populate("author", "name email");

  const comments = await Comment.find({ post: post._id })
    .populate("author", "name")
    .sort({ createdAt: -1 });

  res.json({
    ...post.toObject(),
    comments,
  });
});

export const getMyPosts = asyncHandler(async (req, res) => {
  const drafts = await BlogPost.find({
    author: req.user._id,
    status: "draft",
  }).sort({ createdAt: -1 });

  const published = await BlogPost.find({
    author: req.user._id,
    status: "published",
  }).sort({ createdAt: -1 });

  const archived = await BlogPost.find({
    author: req.user._id,
    status: "archived",
  }).sort({ createdAt: -1 });

  res.json({ drafts, published, archived });
});

export const publishPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);

  if (!post)
    return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized" });

  if (post.status === "published")
    return res.status(400).json({ error: "Already published" });

  post.status = "published";
  await post.save();

  res.json({ message: "Post published" });
});

export const archivePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);

  if (!post)
    return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized" });

  if (post.status !== "published")
    return res.status(400).json({
      error: "Only published posts can be archived",
    });

  post.status = "archived";
  await post.save();

  res.json({ message: "Post archived" });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);

  if (!post)
    return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized" });

  if (post.status !== "draft")
    return res.status(400).json({
      error: "Only drafts can be edited",
    });

  const { title, content, tags } = req.body;

  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (tags !== undefined) post.tags = tags;

  await post.save();

  res.json(post);
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);

  if (!post)
    return res.status(404).json({ error: "Post not found" });

  if (post.author.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized" });

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.json({ message: "Post permanently deleted" });
});
