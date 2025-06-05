import { createBuildSeries } from './tasks'
import { run, withTaskName } from './utils/task'

export default createBuildSeries(
  withTaskName('pack', () => run('vsce package --no-dependencies')),
)
