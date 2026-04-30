import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import JobFilters from "../../components/jobs/JobFilters";

describe("JobFilters", () => {
  it("renders values and notifies filter changes", async () => {
    const user = userEvent.setup();
    const onKeywordChange = jest.fn();
    const onLocationChange = jest.fn();
    const onLevelChange = jest.fn();
    const onSkillChange = jest.fn();
    const onSalaryMinChange = jest.fn();
    const onSalaryMaxChange = jest.fn();
    const onReset = jest.fn();

    function Harness() {
      const [keyword, setKeyword] = useState("React");
      const [location, setLocation] = useState("HANOI");
      const [level, setLevel] = useState("SENIOR");
      const [skill, setSkill] = useState("TypeScript");
      const [salaryMin, setSalaryMin] = useState("1000");
      const [salaryMax, setSalaryMax] = useState("3000");

      return (
        <JobFilters
          keyword={keyword}
          location={location}
          level={level}
          skill={skill}
          salaryMin={salaryMin}
          salaryMax={salaryMax}
          salaryError="Lương chưa hợp lệ"
          activeFilterCount={4}
          isFiltering={false}
          locationOptions={["HANOI", "REMOTE"]}
          levelOptions={["JUNIOR", "SENIOR"]}
          skillOptions={["React", "TypeScript"]}
          onKeywordChange={(value) => {
            setKeyword(value);
            onKeywordChange(value);
          }}
          onLocationChange={(value) => {
            setLocation(value);
            onLocationChange(value);
          }}
          onLevelChange={(value) => {
            setLevel(value);
            onLevelChange(value);
          }}
          onSkillChange={(value) => {
            setSkill(value);
            onSkillChange(value);
          }}
          onSalaryMinChange={(value) => {
            setSalaryMin(value);
            onSalaryMinChange(value);
          }}
          onSalaryMaxChange={(value) => {
            setSalaryMax(value);
            onSalaryMaxChange(value);
          }}
          onReset={onReset}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByDisplayValue("React")).toBeInTheDocument();
    expect(screen.getByText("Lương chưa hợp lệ")).toBeInTheDocument();

    await user.clear(screen.getByTestId("job-filter-keyword"));
    await user.type(screen.getByTestId("job-filter-keyword"), "Node");
    expect(onKeywordChange).toHaveBeenLastCalledWith("Node");

    await user.selectOptions(screen.getByTestId("job-filter-location"), "REMOTE");
    expect(onLocationChange).toHaveBeenCalledWith("REMOTE");

    await user.selectOptions(screen.getByTestId("job-filter-level"), "JUNIOR");
    expect(onLevelChange).toHaveBeenCalledWith("JUNIOR");

    await user.selectOptions(screen.getByTestId("job-filter-skill"), "React");
    expect(onSkillChange).toHaveBeenCalledWith("React");

    await user.clear(screen.getByTestId("job-filter-salary-min"));
    await user.type(screen.getByTestId("job-filter-salary-min"), "12a3");
    expect(onSalaryMinChange).toHaveBeenLastCalledWith("123");

    await user.clear(screen.getByTestId("job-filter-salary-max"));
    await user.type(screen.getByTestId("job-filter-salary-max"), "4x5");
    expect(onSalaryMaxChange).toHaveBeenLastCalledWith("45");

    await user.click(screen.getByRole("button", { name: /xóa 4/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
