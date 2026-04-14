// Assets
const downloadSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="512" height="512" fill="none">
    <path fill="currentColor"
        d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z" />
</svg>`

const showCardActions = document.querySelector(".project-show-card__actions")
if (showCardActions && !document.getElementById("export_button_id")) {
    const exportButton = document.createElement("button")
    exportButton.type = "button"
    exportButton.onclick = exportDevlogs
    exportButton.id = "export_button_id"
    exportButton.className = "btn btn--brown btn--borderless"
    exportButton.innerHTML = `${downloadSVG} Export Devlogs`
    showCardActions.appendChild(exportButton)
}

function exportDevlogs() {
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
                type: attachment.nodeType,
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


    const json = {
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
    const md = `
![${projectName} banner](${projectBanner})
# [${projectName}](${projectUrl}) [(Repository)](${projectRepository})
Created by: [${projectAuthor}](${projectAuthorUrl})

${devlogCount} • ${timeSpent} • ${followers}

    ${projectDesc}
---
# Devlogs

${devlogs.map(devlog => `
${devlog.time} • ${devlog.duration}

---

${devlog.body}

---

${devlog.attachments.map(attachment => `![${attachment.type} attachment](${attachment.src})`)}
---
`)}
`
    console.log(md)
    console.log(json)
}