<!--
 - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

<template>
	<NcDialog
		:name="t('Authentication required')"
		content-classes="vue-password-confirmation"
		@update:open="close">
		<!-- Dialog content -->
		<p>{{ t('This action needs authentication, please confirm it by entering your password.') }}</p>
		<form class="vue-password-confirmation__form" @submit.prevent="confirm">
			<NcPasswordField
				ref="field"
				v-model="password"
				:label="t('Password')"
				:helper-text="helperText"
				:error="showError"
				required />
			<NcButton
				class="vue-password-confirmation__submit"
				variant="primary"
				type="submit"
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
import { defineComponent } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcPasswordField from '@nextcloud/vue/components/NcPasswordField'
import { t } from '../utils/l10n.js'

type ICanFocus = {
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
		/**
		 * Function to call to validate password
		 */
		validate: {
			type: Function,
			required: true,
		},
	},

	emits: ['close'],

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
				return t('Checking password …') // TRANSLATORS: This is a status message, shown when the system is checking the users password
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
				this.$emit('close', true)
			} catch (error) {
				console.debug('Exception during password confirmation', { error })
				this.showError = true
				this.selectPasswordField()
			} finally {
				this.loading = false
			}
		},

		close(open: boolean): void {
			if (!open) {
				this.$emit('close', false)
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
