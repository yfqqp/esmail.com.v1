// src/app/[locale]/admin/projects/page.tsx
import { adminGetProjects } from '@/services'
import { PageHeader } from '@/components/admin/shared/ui'
import { ProjectsManagerClient } from '@/components/admin/projects/ProjectsManagerClient'

export default async function AdminProjectsPage() {
  const { data: projects } = await adminGetProjects({ page: 1, pageSize: 100, sortBy: 'sort_order' })

  return (
    <div>
      <PageHeader title="Projects" description="Manage your technical and engineering projects" />
      <ProjectsManagerClient initialProjects={projects} />
    </div>
  )
}
