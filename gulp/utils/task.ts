import type { TaskFunction } from 'gulp'
import { spawn } from 'node:child_process'
import process from 'node:process'

import { green } from 'chalk'
import { consola } from 'consola'
import { rootDir } from './constant'

export function withTaskName<T extends TaskFunction>(name: string, fn: T) {
  return Object.assign(fn, { displayName: name })
}

export async function run(command: string, cwd: string = rootDir) {
  return new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    consola.info(`run: ${green(`${cmd} ${args.join(' ')}`)}`)
    const app = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    const onProcessExit = () => app.kill('SIGHUP')

    app.on('close', (code) => {
      process.removeListener('exit', onProcessExit)

      if (code === 0) {
        resolve()
      }
      else {
        reject(
          new Error(`Command failed. \n Command: ${command} \n Code: ${code}`),
        )
      }
    })
    process.on('exit', onProcessExit)
  })
}
