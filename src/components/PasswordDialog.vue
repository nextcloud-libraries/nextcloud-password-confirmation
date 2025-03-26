<!--
 - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

<template>
	<NcDialog :name="t('Confirm your password')"
		:container="null"
		content-classes="vue-password-confirmation"
		@update:open="close">
		<!-- Dialog content -->
		<p>{{ t('This action needs authentication') }}</p>
		<form class="vue-password-confirmation__form" @submit.prevent="confirm">
			<NcPasswordField ref="field"
				v-model="password"
				:label="t('Password')"
				:helper-text="helperText"
				:error="showError"
				required />
			<NcButton class="vue-password-confirmation__submit"
				type="primary"
				native-type="submit"
				:disabled="!password || loading">
				<template v-if="loading" #icon>
					<NcLoadingIcon :size="20" />
				</template>
				{{ t('Confirm') }}
			</NcButton>
		</form>
	</NcDialog>
</template>

<script lang="ts">
import NcButton from '@nextcloud/vue/components/NcButton'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcPasswordField from '@nextcloud/vue/components/NcPasswordField'
import { defineComponent } from 'vue'
import { t } from '../utils/l10n.js'

import type { ComponentInstance } from 'vue'

type ICanFocus = ComponentInstance & {
	focus: () => void
	select: () => void
}

export default defineComponent({
	name: 'PasswordDialog',

	components: {
		NcButton,
		NcDialog,
		NcLoadingIcon,
		NcPasswordField,
	},

	props: {
		validate: {
			type: Function,
			default: () => {},
		},
	},

	data() {
		return {
			password: '',
			loading: false,
			showError: false,
		}
	},

	computed: {
		helperText() {
			if (this.showError) {
				return this.password === '' ? t('Please enter your password') : t('Wrong password')
			}
			if (this.loading) {
				return t('Checking password …') // TRANSLATORS: This is a status message, shown when the system is checking the users password
			}
			return ''
		},
	},

	mounted() {
		this.focusPasswordField()
	},

	methods: {
		t,

		async confirm(): Promise<void> {
			this.showError = false
			this.loading = true

			if (this.password === '') {
				this.showError = true
				return
			}

			try {
				await this.validate(this.password)
				this.$emit('confirmed')
			} catch (e) {
				this.showError = true
				this.selectPasswordField()
			} finally {
				this.loading = false
			}
		},

		close(open: boolean): void {
			if (!open) {
				this.$emit('close')
			}
		},

		focusPasswordField() {
			this.$nextTick(() => {
				(this.$refs.field as ICanFocus).focus()
			})
		},

		selectPasswordField() {
			this.$nextTick(() => {
				(this.$refs.field as ICanFocus).select()
			})
		},
	},
})
</script>

<style lang="scss">
.vue-password-confirmation {
	display: flex;
	flex-direction: column;
	margin-inline: 6px;
	margin-block-end: 6px;
	gap: 10px 0;

	&__form {
		display: flex;
		flex-direction: column;
		gap: 8px 0;
		// allow focus visible outlines
		padding: 2px;
	}

	&__submit {
		align-self: end;
	}
}
</style>
