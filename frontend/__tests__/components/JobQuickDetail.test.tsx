import { render, screen } from "@testing-library/react";
import JobQuickDetail from "../../components/jobs/JobQuickDetail";
import type { Job } from "../../types/models";

const detailJob: Job = {
  id: 51,
  name: "Backend Java Engineer",
  location: "HOCHIMINH",
  salary: 42000000,
  quantity: 1,
  level: "MIDDLE",
  active: true,
  endDate: "2099-11-05T00:00:00.000Z",
  description: "<p>Work on APIs, platform quality and delivery pipelines.</p>",
  company: {
    id: 3,
    name: "Platform Works",
    address: "TP. Hồ Chí Minh"
  },
  skills: [
    { id: 4, name: "Java" },
    { id: 5, name: "Spring Boot" }
  ]
};

describe("JobQuickDetail", () => {
  it("renders an empty state before a job is selected", () => {
    render(<JobQuickDetail job={null} />);

    expect(screen.getByText(/chi tiết nhanh/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /chi tiết/i })).not.toBeInTheDocument();
  });

  it("renders selected job information and actions", () => {
    render(<JobQuickDetail job={detailJob} />);

    expect(screen.getByText("Backend Java Engineer")).toBeInTheDocument();
    expect(screen.getByText("Platform Works")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("Spring Boot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chi tiết/i })).toHaveAttribute("href", "/jobs/51");
    expect(screen.getByRole("link", { name: /hỏi ai/i })).toHaveAttribute("href", "/chatbot?jobId=51");
  });
});
