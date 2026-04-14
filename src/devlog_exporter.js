// Assets
const downloadSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="512" height="512" fill="none">
    <path fill="currentColor"
        d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z" />
</svg>`


function createDialog() {
    const dialog = document.createElement("dialog")
    dialog.id = "project-export-devlogs-modal"
    dialog.className = "modal"
    dialog.dataset["controller"] = "modal"
    
    const title = document.createElement("h3")
    title.className = "modal__title"
    title.style = "border-radius: calc(var(--border-radius)*.6);"
    title.textContent = "Export Devlogs"
    const createModalButton = (content, onclick, style = null) => {
        const button = document.createElement("button")
        if (style) button.style = style
        button.type = "button"
        button.className = "modal__actions-close"
        button.onclick = onclick
        button.textContent = content
        return button
    }
    const buttonContainer = document.createElement("div")
    buttonContainer.style = "display: flex; flex-direction: column; grid-gap: 10px;"
    buttonContainer.textContent = "Export all your devlogs!"
    const bigButtonStyle = "font-size: 1.5rem;"
    const exportMarkdownButton = createModalButton("Export Markdown", () => {
        const json = generateJSON()
        const md = generateMarkdown(json)
        const filename = json.project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        download(`${filename}_devlogs.md`, md)
        dialog.close()
    })
    const exportJSONButton = createModalButton("Export JSON", () => {
        const json = generateJSON()
        const filename = json.project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        download(`${filename}_devlogs.json`, JSON.stringify(json))
        dialog.close()
    })
    const exportZIPButton = createModalButton("Export ZIP", () => {
        exportZIPButton.disabled = true
        generateZIP(exportZIPButton)
        dialog.close()
    })
    const closeButton = createModalButton("Close", () => dialog.close())
    const exitContainer = document.createElement("div");
    exitContainer.className = "modal__actions";
    
    exitContainer.appendChild(exportJSONButton)
    exitContainer.appendChild(exportMarkdownButton)
    exitContainer.appendChild(exportZIPButton)
    exitContainer.appendChild(closeButton)
    dialog.appendChild(title)
    dialog.appendChild(buttonContainer)
    dialog.appendChild(exitContainer)
    return dialog
}

function createExportButton(showDialog) {
    const exportButton = document.createElement("button")
    exportButton.type = "button"
    exportButton.onclick = showDialog
    exportButton.id = "export_button_id"
    exportButton.className = "btn btn--brown btn--borderless"
    exportButton.innerHTML = `${downloadSVG} Export Devlogs`
    return exportButton
}

const showCardActions = document.querySelector(".project-show-card__actions")
if (showCardActions && !document.getElementById("export_button_id")) {
    const dialog = createDialog()
    const exportButton = createExportButton(() => dialog.showModal())
    showCardActions.appendChild(exportButton)
    showCardActions.appendChild(dialog)
}

function generateJSON() {
    const projectUrl = location.href
    const projectBanner = document.querySelector(".project-card__banner-image").src
    const projectName = document.querySelector(".project-show-card__title-text").textContent
    const projectAuthorElement = document.querySelector(".project-show-card__byline > a")
    const projectAuthor = projectAuthorElement.textContent
    const projectAuthorUrl = `https://flavortown.hackclub.com${projectAuthorElement.href}`

    const projectStats = document.querySelector(".project-show-card__stats").children
    const [devlogCount, timeSpent, followers] =
        Array.from(projectStats).map(v => v.textContent.trim())

    const projectDesc = document.querySelector(".project-show-card__description > p").textContent
    const projectRepository = document.querySelector(".project-show-card__actions > a").href

    const devlogsData = document.querySelectorAll(".post__content")
    const devlogs = []
    const turndownService = new TurndownService()
    devlogsData.forEach(devlog => {
        const devlogBodyData = devlog.querySelector(".post__body")

        const devlogBodyMarkdown = turndownService.turndown(devlogBodyData)

        const devlogTime = devlog.querySelector(".post__time").textContent
        const devlogDuration = devlog.querySelector(".post__duration").textContent
        const attachmentsData = devlog.querySelectorAll(".post__attachment")
        const attachments = []
        attachmentsData.forEach(attachment => {
            attachments.push({
                type: attachment.tagName,
                src: attachment.src
            })
        })

        devlogs.push({
            body: devlogBodyMarkdown,
            time: devlogTime,
            duration: devlogDuration,
            attachments: attachments
        })
    })


    return {
        project: {
            name: projectName,
            banner: projectBanner,
            flavortownUrl: projectUrl,
            repository: projectRepository,
            author: {
                username: projectAuthor,
                flavortownUrl: projectAuthorUrl
            },
            description: projectDesc,
            stats: {
                devlog_count: devlogCount,
                time_spend: timeSpent,
                followers: followers
            },
        },
        devlogs: devlogs
    }
}

function getFilenameFromContentDisposition(s) {
    if (!s) return null;

    // Try filename* first (RFC 5987)
    const filenameStarMatch = s.match(/filename\*\s*=\s*([^']*)''([^;]+)/i);
    if (filenameStarMatch) return decodeURIComponent(filenameStarMatch[2]);
    // Fallback to filename
    const filenameMatch = s.match(/filename\s*=\s*"([^"]+)"/i);
    if (filenameMatch) return filenameMatch[1];

    return null;
}

async function generateZIP(exportZIPButton) {
    const zip = new JSZip();

    // Add text files
    const json = generateJSON()

    const addFetchFile = async (url, prefix="") => {
        console.log(url)
        const response = await fetch(url)
        const contentDisposition = response.headers.get("content-disposition")
        const filename = getFilenameFromContentDisposition(contentDisposition)
            .replace(/\s/gi, '_')
        const foreignBuffer = await response.arrayBuffer();

        const clean = new Uint8Array(new Uint8Array(foreignBuffer));

        const path = `${prefix}${filename}`
        zip.file(path, clean);
        return path;
    }

    const bannerPath = await addFetchFile(json.project.banner)
    json.project.banner = bannerPath
    for (const [idx, devlog] of json.devlogs.entries()) {
        for (const attachment of devlog.attachments) {
            const path = await addFetchFile(attachment.src, `attachments/devlog_${idx + 1}/`)
            attachment.src = path
        }
    }

    // Add info files
    zip.file("devlogs.json", JSON.stringify(json));
    const md = generateMarkdown(json)
    zip.file("devlogs.md", md);

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const filename = json.project.name.replace(/[^a-z0-9]/gi, '_');
    saveAs(content, `${filename}_devlogs.zip`);
    exportZIPButton.disabled = false
}
function generateMarkdown(json) {
    const proj = json.project
    const author = proj.author
    const devlogs = json.devlogs
    return `
![${proj.name} banner](${proj.banner})
# [${proj.name}](${proj.flavortownUrl}) [(Repository)](${proj.repository})
Created by: [${author.username}](${author.flavortownUrl})

${proj.stats.devlog_count} • ${proj.stats.time_spend} • ${proj.stats.followers}

    ${proj.description}
---
# Devlogs

${devlogs.map(devlog => `
${devlog.time} • ${devlog.duration}

${devlog.body}

---

${devlog.attachments.map(attachment => 
    (attachment.type == "IMG") ? `![IMAGE attachment](${attachment.src})` :
    `<video src="${attachment.src}" controls></video>`
).join("\n")}

`).join("\n\n---")}
`
}

function download(filename, text) {
    var element = document.createElement('a');
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    element.download = filename

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}