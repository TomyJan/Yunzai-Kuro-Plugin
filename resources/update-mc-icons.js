import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const RESOURCE_FILES = [
  'roleinfo.json',
  'roleskin.json',
  'weaponconf.json',
  'weaponskin.json',
]
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))

function loadRecords(resourcesDirectory) {
  const records = {}

  for (const filename of RESOURCE_FILES) {
    const filePath = path.join(resourcesDirectory, filename)
    const contents = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
    const data = JSON.parse(contents)

    if (
      !Array.isArray(data) ||
      data.some(
        (row) => row === null || typeof row !== 'object' || Array.isArray(row),
      )
    ) {
      throw new Error(`${filePath} must contain a JSON array of objects`)
    }

    records[filename] = data
  }

  return records
}

function referenceFilename(reference) {
  if (typeof reference !== 'string' || !reference.trim()) return null

  const basename = reference.trim().replaceAll('\\', '/').split('/').at(-1)
  const extension = path.posix.extname(basename)
  const name = extension ? basename.slice(0, -extension.length) : basename

  return name ? `${name}.png` : null
}

function indexIcons(directory) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Icon directory not found: ${directory}`)
  }

  const index = new Map()

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.png')
      continue

    const key = entry.name.toLowerCase()
    if (index.has(key))
      throw new Error(`Ambiguous icon filename in ${directory}: ${entry.name}`)

    index.set(key, path.join(directory, entry.name))
  }

  return index
}

function buildCopyPlan(records, roleIcons, weaponIcons) {
  const copyPlan = new Map()
  let unmatched = 0
  const sources = [
    ['roleinfo.json', 'Id', 'RoleHeadIconLarge', roleIcons],
    ['roleskin.json', 'Id', 'Icon', roleIcons],
    ['weaponconf.json', 'ItemId', 'Icon', weaponIcons],
    ['weaponskin.json', 'Id', 'Icon', weaponIcons],
  ]

  for (const [jsonName, idField, iconField, iconIndex] of sources) {
    for (const [rowIndex, row] of records[jsonName].entries()) {
      const assetId = row[idField]
      if (
        assetId === undefined ||
        assetId === null ||
        !/^\d+$/.test(String(assetId))
      ) {
        throw new Error(
          `${jsonName} row ${rowIndex + 1} has an invalid ${idField}`,
        )
      }

      let reference = row[iconField]
      if (jsonName === 'roleskin.json' && !reference)
        reference = row.RoleHeadIconLarge

      const filename = referenceFilename(reference)
      const source = filename ? iconIndex.get(filename.toLowerCase()) : null
      if (!source) {
        unmatched += 1
        continue
      }

      const outputName = `${assetId}.png`
      const previousSource = copyPlan.get(outputName)
      if (
        previousSource &&
        path.resolve(previousSource) !== path.resolve(source)
      ) {
        throw new Error(`Multiple different icons map to ${outputName}`)
      }

      copyPlan.set(outputName, source)
    }
  }

  return { copyPlan, unmatched }
}

function syncIcons(repoRoot, uiResourcesRoot, dryRun) {
  const resourcesDirectory = path.join(repoRoot, 'resources')
  const outputDirectory = path.join(
    resourcesDirectory,
    'img',
    'common',
    'item',
    'mc',
  )
  const imageRoot = path.join(uiResourcesRoot, 'UIResources', 'Common', 'Image')
  const records = loadRecords(resourcesDirectory)
  const roleIcons = indexIcons(path.join(imageRoot, 'IconRoleHead256'))
  const weaponIcons = indexIcons(path.join(imageRoot, 'IconWeapon'))
  const { copyPlan, unmatched } = buildCopyPlan(records, roleIcons, weaponIcons)

  if (!dryRun && copyPlan.size === 0) {
    throw new Error(
      'No icons matched; the destination directory was left unchanged',
    )
  }

  if (fs.existsSync(outputDirectory)) {
    const destinationStat = fs.lstatSync(outputDirectory)
    if (destinationStat.isSymbolicLink())
      throw new Error(`Refusing to replace a symlink: ${outputDirectory}`)
    if (!destinationStat.isDirectory())
      throw new Error(`Destination is not a directory: ${outputDirectory}`)
  }

  if (!dryRun) {
    const parentDirectory = path.dirname(outputDirectory)
    fs.mkdirSync(parentDirectory, { recursive: true })

    const temporaryDirectory = fs.mkdtempSync(
      path.join(parentDirectory, '.mc-icons-'),
    )
    const stagedDirectory = path.join(temporaryDirectory, 'new')
    const previousDirectory = path.join(temporaryDirectory, 'previous')
    fs.mkdirSync(stagedDirectory)

    for (const [outputName, source] of copyPlan) {
      fs.copyFileSync(source, path.join(stagedDirectory, outputName))
    }

    const sentinelPath = path.join(outputDirectory, '-1.png')
    if (fs.existsSync(sentinelPath) && fs.statSync(sentinelPath).isFile()) {
      fs.copyFileSync(sentinelPath, path.join(stagedDirectory, '-1.png'))
    }

    const hadPreviousDirectory = fs.existsSync(outputDirectory)
    try {
      if (hadPreviousDirectory)
        fs.renameSync(outputDirectory, previousDirectory)
      fs.renameSync(stagedDirectory, outputDirectory)
    } catch (error) {
      if (
        hadPreviousDirectory &&
        fs.existsSync(previousDirectory) &&
        !fs.existsSync(outputDirectory)
      ) {
        fs.renameSync(previousDirectory, outputDirectory)
      }
      throw error
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  }

  return { copied: copyPlan.size, unmatched }
}

function parseArguments(args) {
  const options = {
    repoRoot: path.resolve(SCRIPT_DIRECTORY, '..'),
    uiResourcesRoot: null,
    dryRun: false,
    help: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--dry-run') {
      options.dryRun = true
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (
      argument === '--repo-root' ||
      argument === '--ui-resources-root'
    ) {
      const value = args[index + 1]
      if (!value || value.startsWith('--'))
        throw new Error(`Missing path after ${argument}`)
      options[argument === '--repo-root' ? 'repoRoot' : 'uiResourcesRoot'] =
        path.resolve(value)
      index += 1
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }

  if (!options.uiResourcesRoot) {
    options.uiResourcesRoot = path.join(
      path.dirname(options.repoRoot),
      'WutheringWaves-UIResources',
    )
  }

  return options
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
      console.log(
        'Usage: node resources/update-mc-icons.js [--dry-run] [--repo-root PATH] [--ui-resources-root PATH]',
      )
      return
    }

    const result = syncIcons(
      options.repoRoot,
      options.uiResourcesRoot,
      options.dryRun,
    )
    console.log(
      `${options.dryRun ? 'Would refresh' : 'Refreshed'} ${result.copied} icon files.`,
    )
    if (result.unmatched > 0) {
      console.log(
        `Skipped ${result.unmatched} JSON entries without a matching source icon.`,
      )
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

main()
