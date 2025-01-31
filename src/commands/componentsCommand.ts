import { resolve } from 'path'
import { CommandModule } from 'yargs'
import { enableLogger, verbose } from '../log'
import { readComponentsFromDir, writeOver } from '../fs'
import {
  mergeWriters,
  renderWriterImportsToString,
  renderWriterToString,
} from '../writer'
import { basicComponentWriter } from '../componentWriters'

interface ComponentsCommandArguments {
  cwd?: string
  componentsRootPath: string
  typesOutputFile: string
}

export const componentsCommand: CommandModule<
  {},
  ComponentsCommandArguments
> = {
  command: 'components <componentsRootPath> <typesOutputFile>',
  describe: 'Generate TypeScript types for components',
  builder(yargs) {
    return yargs
      .option('cwd', {
        describe: 'Change the current working directory',
        type: 'string',
      })
      .positional('componentsRootPath', {
        describe: 'Path to components directory with yaml files',
        type: 'string',
        default: '',
      })
      .positional('typesOutputFile', {
        describe:
          'File path and name to write the TypeScript types to',
        type: 'string',
        default: '',
      })
  },
  async handler(argv) {
    enableLogger(!!argv.verbose)
    verbose('Args', argv)
    const cwd = argv.cwd
      ? resolve(argv.cwd) + '/'
      : process.cwd() + '/'
    verbose('Using cwd', cwd)
    const components = await readComponentsFromDir(
      argv.componentsRootPath
    )
    verbose(`Found ${components.length} components`)
    const componentWriters = components.map(basicComponentWriter)
    const merged = mergeWriters(componentWriters)
    await writeOver(
      argv.typesOutputFile,
      `/* AUTOGENERATED FROM: ${argv.componentsRootPath} */
${renderWriterImportsToString(merged)}

${renderWriterToString(merged)}
`
    )
  },
}
