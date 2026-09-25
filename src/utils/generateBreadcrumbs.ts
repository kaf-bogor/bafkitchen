interface Breadcrumb {
  label: string
  path: string
}

export default function generateBreadcrumbs(): Breadcrumb[] {
  const currentPath = window.location.pathname
  // Split the current path into segments
  const segments = currentPath.split('/').filter(Boolean)

  // Initialize the breadcrumbs array
  const breadcrumbs: Breadcrumb[] = []

  // Build the breadcrumbs
  segments.forEach((segment, index) => {
    // Create the path up to the current segment
    const path = '/' + segments.slice(0, index + 1).join('/')

    // Create the breadcrumb object
    const breadcrumb: Breadcrumb = {
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: path
    }

    // Add the breadcrumb to the array
    breadcrumbs.push(breadcrumb)
  })

  return breadcrumbs
}
