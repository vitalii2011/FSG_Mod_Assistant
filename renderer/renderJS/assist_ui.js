/*  _______           __ _______               __         __   
   |   |   |.-----.--|  |   _   |.-----.-----.|__|.-----.|  |_ 
   |       ||  _  |  _  |       ||__ --|__ --||  ||__ --||   _|
   |__|_|__||_____|_____|___|___||_____|_____||__||_____||____|
   (c) 2022-present FSG Modding.  MIT License. */

// Main Window UI

/* global l10n, fsgUtil, bootstrap, select_lib */


/*  __ ____   ______        
   |  |_   | |      |.-----.
   |  |_|  |_|  --  ||     |
   |__|______|______||__|__| */

function processL10N()          { clientGetL10NEntries(); l10n.langList_send() }
function clientChangeL10N()     { l10n.langList_change(fsgUtil.byId('language_select').value) }
function clientGetL10NEntries() {
	const l10nSendItems = new Set()

	fsgUtil.query('l10n').forEach((thisL10nItem) => {
		l10nSendItems.add(fsgUtil.getAttribNullError(thisL10nItem, 'name'))
	})

	l10n.getText_send(l10nSendItems)
}

window.l10n.receive('fromMain_langList_return', (listData, selected) => {
	fsgUtil.byId('language_select').innerHTML = listData.map((x) => {
		return fsgUtil.buildSelectOpt(x[0], x[1], selected)
	}).join('')
})
window.l10n.receive('fromMain_getText_return', (data) => {
	fsgUtil.query(`l10n[name="${data[0]}"]`).forEach((item) => { item.innerHTML = data[1] })
})
window.l10n.receive('fromMain_getText_return_title', (data) => {
	fsgUtil.query(`l10n[name="${data[0]}"]`).forEach((item) => {
		item.closest('button').title = data[1]
		new bootstrap.Tooltip(item.closest('button'))
	})
})
window.l10n.receive('fromMain_l10n_refresh', () => { processL10N() })

window.mods.receive('fromMain_selectAllOpen', () => {
	const lastOpenAcc = document.querySelector('.accordion-collapse.show')
	const lastOpenID  = (lastOpenAcc !== null) ? lastOpenAcc.id : null

	if ( lastOpenID !== null ) { select_lib.click_all(lastOpenID) }
})

window.mods.receive('fromMain_modList', (currLocale, modList, extraL10n, currentList, modFoldersMap, newList, modHubList) => {
	const lastOpenAcc = document.querySelector('.accordion-collapse.show')
	const lastOpenID  = (lastOpenAcc !== null) ? lastOpenAcc.id : null
	const scrollStart = window.scrollY

	const selectedList = ( currentList !== '999' && currentList !== '0') ? `collection--${currentList}` : currentList
	const modTable     = []
	const optList      = []
	
	optList.push(fsgUtil.buildSelectOpt('0', `--${extraL10n[0]}--`, selectedList, true))
	
	Object.keys(modList).forEach((collection) => {
		const modRows      = []
		let   sizeOfFolder = 0

		modList[collection].mods.forEach((thisMod) => {
			const extraBadges = []
			const modId       = modHubList.mods[thisMod.fileDetail.shortName] || null

			sizeOfFolder += thisMod.fileDetail.fileSize

			if ( newList.includes(thisMod.md5Sum) && !thisMod.canNotUse ) {
				extraBadges.push('<span class="badge bg-success"><l10n name="mod_badge_new"></l10n></span>')
			}
			if ( modId !== null && modHubList.last.includes(modId) ) {
				extraBadges.push('<span class="badge bg-success"><l10n name="mod_badge_recent"></l10n></span>')
			}

			let theseBadges = thisMod.badges + extraBadges.join('')

			if ( theseBadges.match('mod_badge_broken') && theseBadges.match('mod_badge_notmod') ) {
				theseBadges = theseBadges.replace('<span class="badge bg-danger"><l10n name="mod_badge_broken"></l10n></span>', '')
			}
			
			modRows.push(makeModRow(
				`${collection}--${thisMod.uuid}`,
				thisMod.fileDetail.shortName,
				thisMod.l10n.title,
				thisMod.modDesc.author,
				thisMod.modDesc.version,
				( thisMod.fileDetail.fileSize > 0 ) ? fsgUtil.bytesToHR(thisMod.fileDetail.fileSize, currLocale) : '',
				theseBadges,
				thisMod.canNotUse,
				thisMod.modDesc.iconImageCache,
				modId
			))
		})
		modTable.push(makeModCollection(
			collection,
			`${modList[collection].name} (${modList[collection].mods.length}) <small>[${fsgUtil.bytesToHR(sizeOfFolder, currLocale)}]</small>`,
			modRows
		))
		optList.push(fsgUtil.buildSelectOpt(`collection--${collection}`, modList[collection].name, selectedList, false, modFoldersMap[collection]))

	})
	optList.push(fsgUtil.buildSelectOpt('999', `--${extraL10n[1]}--`, selectedList, true))
	fsgUtil.byId('collectionSelect').innerHTML = optList.join('')
	fsgUtil.byId('mod-collections').innerHTML  = modTable.join('')

	const activeFolder = document.querySelector(`[data-bs-target="#${currentList}_mods"] svg`)
	if ( activeFolder !== null ) {
		activeFolder.innerHTML += '<polygon fill="#43A047" points="290.088 61.432 117.084 251.493 46.709 174.18 26.183 197.535 117.084 296.592 310.614 83.982"></polygon>'
	}
	
	select_lib.clear_range()

	try {
		document.getElementById(lastOpenID).classList.add('show')
		window.scrollTo(0, scrollStart)
	} catch { /* nope */ }

	processL10N()
})


function clientMakeListInactive() {
	fsgUtil.byId('collectionSelect').value = 0
	window.mods.makeInactive()
}
function clientMakeListActive() {
	const activePick = fsgUtil.byId('collectionSelect').value.replace('collection--', '')

	if ( activePick !== '0' && activePick !== '999' ) {
		window.mods.makeActive(activePick)
	}
}

function makeModCollection(id, name, modsRows) {
	return `<tr class="mod-table-folder">
	<td class="folder-icon collapsed" ${fsgUtil.buildBS('toggle', 'collapse')} ${fsgUtil.buildBS('target', `#${id}_mods`)}>
		${fsgUtil.getIconSVG('folder')}
	</td>
	<td class="folder-name collapsed" ${fsgUtil.buildBS('toggle', 'collapse')} ${fsgUtil.buildBS('target', `#${id}_mods`)}>
		${name}
	</td>
	<td class="text-end">
		<button class="btn btn-primary btn-sm me-2" onclick="window.mods.openSave('${id}')"><l10n name="check_save"></l10n></button>
	</td>
</tr>
<tr class="mod-table-folder-detail collapse accordion-collapse data-bs-parent=".table" id="${id}_mods">
	<td class="mod-table-folder-details px-0 ps-4" colspan="3">
		<table class="w-100 py-0 my-0 table table-sm table-hover table-striped">
			<tr>
				<td colspan="4">
					<div class="row g-2 mb-1">
						<div class="col">
							<div class="input-group input-group-sm mb-0">
								<span class="input-group-text bg-gradient"><l10n name="filter_only"></l10n></span>
								<input type="text" id="${id}_mods__filter" onkeyup="select_lib.filter('${id}_mods')" class="form-control mod-row-filter">
							</div>
						</div>
						<div class="col col-auto">
							<div class="btn-group btn-group-sm">
								<input type="checkbox" id="${id}_mods__show_non_mod" onchange="select_lib.filter('${id}_mods')" class="btn-check mod-row-filter_check" autocomplete="off" checked>
								<label class="btn btn-outline-success" for="${id}_mods__show_non_mod"><l10n name="show_non_mod"></l10n></label>

								<input type="checkbox" id="${id}_mods__show_broken" onchange="select_lib.filter('${id}_mods')" class="btn-check mod-row-filter_check" autocomplete="off" checked>
								<label class="btn btn-outline-success" for="${id}_mods__show_broken"><l10n name="show_broken"></l10n></label>
							</div>
						</div>
						<div class="col col-auto">
							<div class="btn-group btn-group-sm input-group input-group-sm">
								<span class="input-group-text"><l10n name="select_pick"></l10n></span>
								<button class="btn btn-btn btn-outline-light" onclick="select_lib.click_none('${id}_mods')"><l10n name="select_none"></l10></button>
								<button class="btn btn-btn btn-outline-light" onclick="select_lib.click_all('${id}_mods')"><l10n name="select_all"></l10></button>
								<button class="btn btn-btn btn-outline-light" onclick="select_lib.click_invert('${id}_mods')"><l10n name="select_invert"></l10></button>
							</div>
						</div>
					</div>
				</td>
			</tr>
			${modsRows.join('')}
		</table>
	</td>
</tr>`
}

function makeModRow(id, name, title, author, version, size, badges, disabled, image, modId) {
	return `<tr onclick="select_lib.click_row('${id}')" ondblclick="window.mods.openMod('${id}')" oncontextmenu="window.mods.openMod('${id}')" class="mod-row${(modId!==null ? ' has-hash' : '')}${(disabled===true)?' mod-disabled bg-opacity-25 bg-danger':''}" id="${id}">
	<td>
		<input type="checkbox" class="form-check-input mod-row-checkbox" id="${id}__checkbox">
	</td>
	<td style="width: 64px; height: 64px">
		<img class="img-fluid" src="${fsgUtil.iconMaker(image)}" />
	</td>
	<td>
		<div class="bg-light"></div>${name}<br /><small>${title} - <em>${author}</em></small><div class="issue_badges">${badges}</div>
	</td>
	<td class="text-end pe-4">
		${version}<br /><em class="small">${size}</em>
	</td>
</tr>`
}


function clientBatchOperation(mode) {
	const selectedMods = []
	const allModRows   = document.querySelectorAll('.mod-row')

	allModRows.forEach((thisRow) => {
		if ( thisRow.querySelector('.mod-row-checkbox').checked ) {
			selectedMods.push(thisRow.id)
		}
	})

	switch (mode) {
		case 'copy':
			if ( selectedMods.length > 0 ) { window.mods.copyMods(selectedMods) }
			break
		case 'move':
			if ( selectedMods.length > 0 ) { window.mods.moveMods(selectedMods) }
			break
		case 'delete':
			if ( selectedMods.length > 0 ) { window.mods.deleteMods(selectedMods) }
			break
		case 'open':
			if ( selectedMods.length === 1 ) { window.mods.openMods(selectedMods) }
			break
		case 'hub':
			if ( selectedMods.length === 1 ) { window.mods.openHub(selectedMods) }
			break
		default:
			break
	}
}

window.addEventListener('hide.bs.collapse', () => { select_lib.clear_all() })
window.addEventListener('show.bs.collapse', () => { select_lib.clear_all() })

window.addEventListener('DOMContentLoaded', () => {	processL10N() })

window.addEventListener('click', () => {
	document.querySelectorAll('.tooltip').forEach((tooltip) => { tooltip.remove() })
})

window.addEventListener('scroll', () => {
	const scrollValue = this.scrollY +  120
	const moveButtons = fsgUtil.byId('moveButtons')
	try {
		moveButtons.style.top = `${scrollValue}px`
	} catch { return }
})
