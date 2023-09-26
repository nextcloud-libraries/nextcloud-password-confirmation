<!--
  - @copyright 2022 Christopher Ng <chrng8@gmail.com>
  -
  - @author Christopher Ng <chrng8@gmail.com>
  -
  - @license AGPL-3.0-or-later
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
	<NcModal :id="dialogId"
		class="dialog"
		size="small"
		:container="null"
		@close="close">
		<div class="dialog__container">
			<h2 class="dialog__title">
				{{ titleText }}
			</h2>
			<p>{{ subtitleText }}</p>

			<NcPasswordField ref="field"
				:value.sync="password"
				:label="passwordLabelText"
				@keydown.enter="confirm" />

			<NcNoteCard v-if="showError"
				:show-alert="true">
				<p>{{ errorText }}</p>
			</NcNoteCard>

			<NcButton type="primary"
				class="dialog__button"
				:aria-label="confirmText"
				@click="confirm">
				{{ confirmText }}
			</NcButton>
		</div>
	</NcModal>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from '@nextcloud/axios'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcModal from '@nextcloud/vue/dist/Components/NcModal.js'
import NcNoteCard from '@nextcloud/vue/dist/Components/NcNoteCard.js'
import NcPasswordField from '@nextcloud/vue/dist/Components/NcPasswordField.js'
import { generateUrl } from '@nextcloud/router'
import { DIALOG_ID } from '../globals.js'
import { t } from '../utils/l10n.js'

import type { ComponentInstance } from 'vue'

export default Vue.extend({
	name: 'PasswordDialog',

	components: {
		NcButton,
		NcModal,
		NcNoteCard,
		NcPasswordField,
	},

	data() {
		return {
			password: '',
			showError: false,
			dialogId: DIALOG_ID,
			titleText: t('Authentication required'),
			subtitleText: t('This action requires you to confirm your password'),
			passwordLabelText: t('Password'),
			errorText: t('Failed to authenticate, please try again'),
			confirmText: t('Confirm'),
		}
	},

	mounted() {
		this.$nextTick(() => {
			((this.$refs.field as ComponentInstance).$el.querySelector('input[type="password"]') as HTMLInputElement).focus()
		})
	},

	methods: {
		async confirm(): Promise<void> {
			this.showError = false

			const url = generateUrl('/login/confirm')
			try {
				const { data } = await axios.post(url, { password: this.password })
				window.nc_lastLogin = data.lastLogin
				this.$emit('confirmed')
			} catch (e) {
				this.showError = true
			}
		},

		close(): void {
			this.$emit('close')
		},
	},
})
</script>

<style lang="scss" scoped>
.dialog {
  &__container {
    display: flex;
    flex-direction: column;
    margin: 30px;
    gap: 10px 0;
  }

  &__title {
    margin-bottom: 0;
  }

  &__button {
    margin-top: 6px;
    align-self: flex-end;
  }
}
</style>
