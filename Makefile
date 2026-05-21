setup:
	npm install
	npx playwright install chromium

clean:
	rm -rf test_results
	rm -rf .tmp_playwright_user_data
	rm -rf .tmp_playwright_tmpdir

check:
	npm run test:unit
	npm run test:e2e
