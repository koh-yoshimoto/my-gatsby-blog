const path = require(`path`)
const _ = require("lodash")

const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for blog post
  const blogPostTemplate = path.resolve(`./src/templates/blog-post.js`)
  const tagsTemplate = path.resolve(`./src/templates/tags.js`)

  // Get all markdown blog posts sorted by date
  const result = await graphql(
    `
      {
        postsRemark: allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: ASC }
          limit: 2000
        ) {
          edges {
            node {
              id
              fields {
                slug
              }
            }
          }
          frontmatter {
            title
          }
        }
        tagsGroup: allMarkdownRemark(limit: 1000) {
          group(field: frontmatter___tags) {
            fieldValue
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      result.errors
    )
    return
  }

  const posts = result.data.postsRemark.edges

  posts.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: blogPostTemplate,
      context: {
        id: post.id,
        previousPostId,
        nextPostId,
      },
    })
  })

  const tags = result.data.tags.group
  if (tags.length > 0) {
    tags.forEach(tag => {
      createPage({
        path: `/tags/${_.kebabCase(tag.fieldValue)}/`,
        component: tagTemplate,
        context: {
          tag: tag.fieldValue,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // Explicitly define the siteMetadata {} object
  // This way those will always be defined even if removed from gatsby-config.js

  // Also explicitly define the Markdown frontmatter
  // This way the "MarkdownRemark" queries will return `null` even when no
  // blog posts are stored inside "content/blog" instead of returning an error
  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
    }

    type Fields {
      slug: String
    }
  `)
}
