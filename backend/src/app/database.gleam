import shared/datetime
import shared/task.{type Task, Task}

pub fn get_tasks() -> List(Task) {
  [Task(name: "Test", time: datetime.now(), period: 1)]
}
