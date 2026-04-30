import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManagementPanel from "../../components/management/ManagementPanel";
import { useAuth } from "../../contexts/auth-context";
import type { Company, Job, Skill } from "../../types/models";

jest.mock("../../contexts/auth-context", () => ({
  useAuth: jest.fn()
}));

function buildJob(id: number): Job {
  return {
    id,
    name: `Backend Engineer ${id}`,
    location: "HANOI",
    salary: 30000000 + id,
    quantity: 1,
    level: "MIDDLE",
    active: true,
    endDate: "2099-12-31T00:00:00.000Z",
    description: "Build APIs",
    company: {
      id: 1,
      name: "Jobhunter Labs"
    },
    skills: [{ id: 1, name: "Java" }]
  };
}

const companies: Company[] = [
  {
    id: 1,
    name: "Jobhunter Labs",
    address: "Ha Noi"
  }
];

const skills: Skill[] = [{ id: 1, name: "Java" }];

describe("ManagementPanel", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      roleName: "ADMIN",
      permissionKeys: [],
      can: jest.fn(() => true)
    });
  });

  it("paginates operational job rows in the management workspace", async () => {
    const user = userEvent.setup();

    render(
      <ManagementPanel
        jobs={Array.from({ length: 9 }, (_, index) => buildJob(index + 1))}
        companies={companies}
        skills={skills}
        resumes={[]}
        users={[]}
        roles={[]}
        permissions={[]}
        userCapabilities={{}}
        createAssignableRoles={[]}
        rbacLoading={false}
        rbacError=""
        onReloadPublicData={jest.fn().mockResolvedValue(undefined)}
        onReloadRbacData={jest.fn().mockResolvedValue(undefined)}
        onCreateJob={jest.fn().mockResolvedValue(undefined)}
        onUpdateJob={jest.fn().mockResolvedValue(undefined)}
        onDeleteJob={jest.fn().mockResolvedValue(undefined)}
        onCreateCompany={jest.fn().mockResolvedValue(undefined)}
        onUpdateCompany={jest.fn().mockResolvedValue(undefined)}
        onDeleteCompany={jest.fn().mockResolvedValue(undefined)}
        onCreateSkill={jest.fn().mockResolvedValue(undefined)}
        onUpdateSkill={jest.fn().mockResolvedValue(undefined)}
        onDeleteSkill={jest.fn().mockResolvedValue(undefined)}
        onUpdateResumeStatus={jest.fn().mockResolvedValue(undefined)}
        onDeleteResume={jest.fn().mockResolvedValue(undefined)}
        onUploadCompanyLogo={jest.fn().mockResolvedValue({
          fileName: "logo.png",
          folder: "company",
          fileUrl: "/logo.png",
          size: 128,
          uploadedAt: "2026-04-30T00:00:00.000Z"
        })}
        onCreateUser={jest.fn().mockResolvedValue(undefined)}
        onUpdateUser={jest.fn().mockResolvedValue(undefined)}
        onDeleteUser={jest.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("Backend Engineer 1")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer 9")).not.toBeInTheDocument();
    expect(screen.getByText("Hiển thị 1-8 / 9 việc làm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sau" }));

    expect(screen.getByText("Backend Engineer 9")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer 1")).not.toBeInTheDocument();
    expect(screen.getByText("Hiển thị 9-9 / 9 việc làm")).toBeInTheDocument();
  });
});
