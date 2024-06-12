import fs from 'fs/promises'

interface DirectoryFullInfo {
    files: string[];
    directories: string[];
    totalFiles: string[];
}

const metaFileNames: Record<keyof DirectoryFullInfo, string> = {
    directories: `meta_directories.json`,
    totalFiles: `meta_total.json`,
    files: `meta_files.json`,
}
const ignoredFilesWhileScan = Object.values(metaFileNames);

async function generateInfoForDirectory(path: string): Promise<DirectoryFullInfo> {
    const children = await fs.readdir(path, {withFileTypes: true});
    const innerFiles = children.filter(it => it.isFile() && !ignoredFilesWhileScan.includes(it.name));
    const innerDirectories = children.filter(it => it.isDirectory());

    const currentFullInfo: DirectoryFullInfo = {
        directories: innerDirectories.map(it => it.name),
        files: innerFiles.map(it => it.name),
        totalFiles: innerFiles.map(it => it.name)
    }

    for (const dir of innerDirectories) {
        const info = await generateInfoForDirectory(`${path}/${dir.name}`);
        const dirFiles = info.totalFiles.map(fileName => `${dir.name}/${fileName}`);
        currentFullInfo.totalFiles = [...currentFullInfo.totalFiles, ...dirFiles];
    }

    Object.keys(currentFullInfo).forEach((key: keyof DirectoryFullInfo) => {
        fs.writeFile(`${path}/${metaFileNames[key]}`, JSON.stringify(currentFullInfo[key]), { encoding: 'utf8'});
    })

    return currentFullInfo;
}

generateInfoForDirectory("root-store")